import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db";
import CustomerModel from "@/lib/db/models/customers";
import AgentModel from "@/lib/db/models/agents";

export async function GET(req, { params }) {
    await DBConnection();
    try {
        const { id } = await params;
        const customer = await CustomerModel.findById(id).populate("agentId");

        if (!customer) {
            return NextResponse.json({ status: 404, msg: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            msg: "Customer data fetched",
            data: customer
        });
    } catch (error) {
        console.error("GET Customer error:", error);
        return NextResponse.json({ status: 500, msg: "Internal Server Error" }, { status: 500 });
    }
}
