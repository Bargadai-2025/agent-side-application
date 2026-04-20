import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db.js";
import AgentModel from "@/lib/db/models/agents.js";
import CustomerModel from "@/lib/db/models/customers";

export async function GET(req, { params }) {
    await DBConnection();
    try {
        const { id } = await params;
        const agent = await AgentModel.findById(id).populate("customers");
        
        if (!agent) {
            return NextResponse.json({ status: 404, msg: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            msg: "Agent data fetched",
            data: agent
        });
    } catch (error) {
        console.error("GET Agent error:", error);
        return NextResponse.json({ status: 500, msg: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    await DBConnection();
    try {
        const { id } = await params;
        const body = await req.json();
        
        // Handle location updates or other fields
        const updatedAgent = await AgentModel.findByIdAndUpdate(id, body, { new: true });

        if (!updatedAgent) {
            return NextResponse.json({ status: 404, msg: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            msg: "Agent updated successfully",
            data: updatedAgent
        });
    } catch (error) {
        console.error("PATCH Agent error:", error);
        return NextResponse.json({ status: 500, msg: "Internal Server Error" }, { status: 500 });
    }
}
