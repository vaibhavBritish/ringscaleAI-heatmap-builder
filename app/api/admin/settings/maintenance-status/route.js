import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
      const setting = await prisma.globalSetting.findUnique({
        where: { key: 'branding' }
      })
      
      const maintenanceMode = setting?.value?.maintenanceMode || false
      
      return NextResponse.json({ maintenanceMode })
    } catch (error) {
      return NextResponse.json({ maintenanceMode: false })
    }
}
