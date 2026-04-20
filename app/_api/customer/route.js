import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db";
import CustomerModel from "@/lib/db/models/customers";

export async function GET() {
    await DBConnection();
    try {
        const customers = await CustomerModel.find();
        return NextResponse.json({ status: 200, msg: "Customers fetched", data: customers });
    } catch (error) {
        return NextResponse.json({ status: 500, msg: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req) {
    await DBConnection();
    try {
        const body = await req.json();
        const customer = await CustomerModel.create(body);
        return NextResponse.json({ status: 200, msg: "Customer created", data: customer });
    } catch (error) {
        return NextResponse.json({ status: 500, msg: "Internal Error" }, { status: 500 });
    }
}
