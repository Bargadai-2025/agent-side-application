import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db";
import CustomerModel from "@/lib/db/models/customers";

export async function GET(req) {
  await DBConnection();

  try {
    const { searchParams } = new URL(req.url);
    const loanNumber = searchParams.get("loan");

    if (!loanNumber) {
      return NextResponse.json(
        { status: 400, msg: "Loan number required" },
        { status: 400 }
      );
    }

    const customer = await CustomerModel.findOne({ loan: loanNumber }).populate("agentId");

    if (!customer) {
      return NextResponse.json(
        { status: 404, msg: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      msg: "Customer found",
      data: customer,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { status: 500, msg: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
