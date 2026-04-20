import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db";
import CustomerModel from "@/lib/db/models/customers";
import cloudinary from "@/lib/cloudinary";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import path from "path";
import fs from "fs";
import { TextDecoder, TextEncoder } from "util";

// Polyfills for face-api.js server-side usage
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}

let faceapi;
let modelsLoaded = false;

export const runtime = "nodejs";

/**
 * Initialize face-api.js with proper Node.js environment setup
 */
async function ensureFaceApi() {
  if (faceapi) return faceapi;
  try {
    faceapi = await import("face-api.js");
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    if (faceapi.tf?.setBackend) {
      await faceapi.tf.setBackend("cpu");
      await faceapi.tf.ready();
    }
    console.log("✅ Face-api.js initialized successfully");
    return faceapi;
  } catch (error) {
    console.error("❌ Failed to initialize face-api.js:", error);
    throw error;
  }
}

/**
 * Load face recognition models from local public/models directory
 */
async function loadModels() {
  if (modelsLoaded) return true;
  try {
    await ensureFaceApi();
    const MODEL_PATH = path.join(process.cwd(), "public/models");
    if (!fs.existsSync(MODEL_PATH)) {
      console.error("❌ Models directory not found:", MODEL_PATH);
      return false;
    }
    // Use SsdMobilenetv1 which is available in this directory
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    modelsLoaded = true;
    console.log("✅ Face recognition models loaded successfully");
    return true;
  } catch (error) {
    console.error("❌ Error loading face models:", error);
    return false;
  }
}

function euclideanDistance(descriptor1, descriptor2) {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export async function POST(req) {
  await DBConnection();
  try {
    const body = await req.json();
    const { customerId, capturedImage } = body;

    if (!customerId || !capturedImage) {
      return NextResponse.json({ status: 400, msg: "Missing customerId or capturedImage" }, { status: 400 });
    }

    const customer = await CustomerModel.findById(customerId).populate("agentId");
    if (!customer) {
      return NextResponse.json({ status: 404, msg: "Customer not found" }, { status: 404 });
    }

    if (!customer.agentId?.image) {
      return NextResponse.json({ status: 404, msg: "Agent reference image not found" }, { status: 404 });
    }

    const modelsReady = await loadModels();
    if (!modelsReady) {
      return NextResponse.json({ status: 500, msg: "Face models failed to load" }, { status: 500 });
    }

    let finalScore = 0;
    let isVerified = false;
    let distance = null;

    try {
      const capturedImg = await loadImage(capturedImage);
      const agentImg = await loadImage(customer.agentId.image);

      // Use SsdMobilenetv1 options with optimized settings
      const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

      const capturedDetection = await faceapi
        .detectSingleFace(capturedImg, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      const agentDetection = await faceapi
        .detectSingleFace(agentImg, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (capturedDetection && agentDetection) {
        distance = euclideanDistance(capturedDetection.descriptor, agentDetection.descriptor);
        
        // OPTIMIZED THRESHOLDS - More realistic for real-world face variations
        // Distance can vary: 0.0 (perfect) to 1.0 (different person)
        // Face variations: lighting, angle, expression increase distance by 0.1-0.2
        const MATCH_THRESHOLD = 0.6;  // Faces are considered same person if distance < 0.6
        
        console.log(`[FACE MATCH] Distance: ${distance.toFixed(4)}`);
        
        if (distance < MATCH_THRESHOLD) {
          // This is a match (same person)
          isVerified = true;
          // Better formula: map distance 0.0-0.6 to score 100%-0%
          // distance 0.1 → 83%, distance 0.3 → 50%, distance 0.6 → 0%
          finalScore = Math.round((1 - distance / MATCH_THRESHOLD) * 100);
          console.log(`✅ FACE MATCH VERIFIED - Score: ${finalScore}%`);
        } else {
          // This is NOT a match (different person)
          isVerified = false;
          finalScore = 0;
          console.log(`❌ FACE MISMATCH - Distance too high: ${distance.toFixed(4)} (threshold: ${MATCH_THRESHOLD})`);
        }
      } else {
        console.warn("⚠️ Face detection failed for one or both images");
        finalScore = 0;
        isVerified = false;
      }
    } catch (faceError) {
      console.error("❌ Face processing error:", faceError);
      finalScore = 0;
      isVerified = false;
    }

    // Upload to Cloudinary
    let imageUrl = capturedImage;
    if (capturedImage.startsWith("data:image")) {
      try {
        const uploadResult = await cloudinary.uploader.upload(capturedImage, {
          folder: "agent_verifications",
        });
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("❌ Cloudinary upload failed:", uploadError);
      }
    }

    // Mock metadata for UI demonstration (In real world, these come from client headers/body)
    const metadata = {
        collectedAt: new Date(),
        collectedLocation: customer.location, // Assuming capture happened at customer location
        deviceModel: "Android 15 (SM-S918B)",
        deviceImei: `820461265/${Math.floor(Math.random() * 900000 + 100000)} | VI Network`,
        networkOperator: "VI Network"
    };

    // Update customer record
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $set: {
          verifiedAgentImage: imageUrl,
          verificationScore: finalScore,
          verificationStatus: isVerified ? "verified" : "failed",
          ...metadata
        },
      },
      { new: true }
    );

    return NextResponse.json({
      status: 200,
      msg: "Agent verification completed",
      data: {
        imageUrl,
        score: finalScore,
        isVerified,
        distance: distance?.toFixed(4),
      },
    });
  } catch (error) {
    console.error("❌ Agent verification failed:", error);
    return NextResponse.json({ status: 500, msg: "Internal Error", error: error.message }, { status: 500 });
  }
}
