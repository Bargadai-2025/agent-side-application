import { NextResponse } from "next/server";
import { DBConnection } from "@/lib/db/db";
import AgentModel from "@/lib/db/models/agents";
import CustomerModel from "@/lib/db/models/customers";

export async function POST(req) {
    await DBConnection();
    try {
        const { identifier: rawIdentifier } = await req.json();
        const identifier = rawIdentifier?.trim();

        if (!identifier) {
            return NextResponse.json({ status: 400, msg: "Identifier is required" }, { status: 400 });
        }

        console.log(`[Login] Attempting login with identifier: ${identifier}`);

        let agent = null;
        let matchedCustomerId = null;

        // 1. Try to find by Agent Name (Case-insensitive)
        agent = await AgentModel.findOne({ name: { $regex: new RegExp(`^${identifier}$`, 'i') } });

        // 2. Try to find by Agent ID directly if it's a valid ObjectId
        if (!agent && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[Login] Attempting direct ID search: ${identifier}`);
            agent = await AgentModel.findById(identifier);
        }

        // 3. Fallback: Search by Customer Loan #
        if (!agent) {
            console.log(`[Login] Agent name/ID match failed. Searching customer loan: ${identifier}`);
            
            // Try searching customer by loan with a fuzzy regex (ignoring common prefixes like LN-)
            const cleanLoan = identifier.toUpperCase().replace(/^LN-?/, "");
            const customer = await CustomerModel.findOne({ 
                $or: [
                    { loan: identifier },
                    { loan: cleanLoan },
                    { loan: { $regex: new RegExp(`${cleanLoan}$`, 'i') } }
                ]
            });

            if (customer) {
                console.log(`[Login] Found customer ${customer.name}. Searching for assigned agent...`);
                matchedCustomerId = customer._id.toString();
                
                // Search for agent who HAS this customer in their 'customers' array
                agent = await AgentModel.findOne({ customers: customer._id });

                // Secondary fallback if array is not used: check agentId on customer
                if (!agent && customer.agentId) {
                    agent = await AgentModel.findById(customer.agentId);
                }
                
                if (agent) console.log(`[Login] Found agent ${agent.name} assigned to customer.`);
            }
        }

        if (!agent) {
            return NextResponse.json({ status: 404, msg: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: 200,
            msg: "Authenticated successfully",
            data: agent,
            matchedCustomerId: matchedCustomerId
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ status: 500, msg: "Internal Server Error" }, { status: 500 });
    }
}
