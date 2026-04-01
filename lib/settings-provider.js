import prisma from "@/lib/prisma"
import { unstable_cache } from "next/cache"

/**
 * Fetches all global settings from the database with caching.
 * The cache is invalidated every 60 seconds.
 */
export const getGlobalSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.globalSetting.findMany()
      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})

      // Return defaults if not found in DB
      return {
        branding: settingsMap.branding || {
          appName: "Ringscale AI",
          supportEmail: "support@ringscale.ai",
          supportPhone: "(619) 625-6148",
          maintenanceMode: false
        },
        plans: settingsMap.plans || {
          Trial: { credits: 300, name: "Trial" },
          advance: { credits: 1200, name: "Advance" },
          pro: { credits: 2400, name: "Pro" },
          pro_plus: { credits: 5000, name: "Pro Plus" }
        }
      }
    } catch (error) {
      console.error("Error fetching global settings:", error)
      return {
        branding: {
          appName: "Ringscale AI",
          supportEmail: "support@ringscale.ai",
          supportPhone: "(619) 625-6148",
          maintenanceMode: false
        }
      }
    }
  },
  ["global-settings"],
  { revalidate: 60, tags: ["settings"] }
)

/**
 * Gets a specific setting category.
 */
export async function getSetting(key) {
  const settings = await getGlobalSettings()
  return settings[key]
}
