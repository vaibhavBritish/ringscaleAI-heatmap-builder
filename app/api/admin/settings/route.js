import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSecret } from "@/lib/secrets"

async function checkAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
        return false
    }
    return true
}

const DEFAULT_SETTINGS = [
    {
        key: "branding",
        value: {
            appName: "Ringscale AI",
            supportEmail: "support@ringscale.ai",
            supportPhone: "(619) 625-6148",
            maintenanceMode: false
        }
    },
    {
        key: "plans",
        value: {
            Trial: { credits: 300, name: "Trial" },
            advance: { credits: 1200, name: "Advance" },
            pro: { credits: 2400, name: "Pro" },
            pro_plus: { credits: 5000, name: "Pro Plus" }
        }
    },
    {
        key: "api_status",
        value: {
            googleMaps: !!getSecret('GOOGLE_API_KEY'),
            stripe: !!getSecret('STRIPE_SECRET_KEY'),
            openai: !!getSecret('OPENAI_API_KEY'),
            mail: !!getSecret('EMAIL_SERVER_PASSWORD')
        }
    }
]

export async function GET() {
    if (!await checkAdmin()) {
        // //console.log("--- SETTINGS DEBUG --- Unauthorized access attempt")
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        // //console.log("--- SETTINGS DEBUG --- Fetching global settings...")
        
        // Use bracket access to bypass potential stale model mapping in stale objects
        const model = prisma['globalSetting']
        
        if (!model) {
            console.error("--- SETTINGS DEBUG --- GlobalSetting model is MISSING in Prisma Client")
            throw new Error("System configuration model not found. Please restart the server.")
        }

        const settings = await model.findMany()
        // //console.log("--- SETTINGS DEBUG --- Found settings count:", settings.length)
        
        // If no settings exist, seed defaults
        if (settings.length === 0) {
            // //console.log("--- SETTINGS DEBUG --- Seeding default settings...")
            await Promise.all(
                DEFAULT_SETTINGS.map(s => 
                    model.create({ data: s })
                )
            )
            // //console.log("--- SETTINGS DEBUG --- Seeding complete.")
            return NextResponse.json(DEFAULT_SETTINGS.reduce((acc, curr) => {
                acc[curr.key] = curr.value
                return acc
            }, {}))
        }

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {})

        return NextResponse.json(settingsMap)
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PATCH(request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { key, value } = body

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
        }

        const model = prisma['globalSetting']
        if (!model) {
            throw new Error("System configuration model not found. Please restart the server.")
        }

        const setting = await model.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })

        return NextResponse.json({ message: "Setting updated successfully", setting })
    } catch (error) {
        console.error('Error updating setting:', error)
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }
}
