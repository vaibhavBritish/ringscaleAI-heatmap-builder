import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emailToTest = 'vaibhavbhallabritish@gmail.com' // From the screenshot
  
  const now = new Date()
  const sixAndAHalfDaysFromNow = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000)

  try {
    const user = await prisma.user.update({
      where: { email: emailToTest },
      data: { trialEndsAt: sixAndAHalfDaysFromNow }
    })
    console.log(`Successfully updated user ${user.email} trial expiration to ${sixAndAHalfDaysFromNow}`)
    console.log('You can now test the cron API!')
  } catch (error) {
    console.log('Error updating user. Make sure the email exists.', error.message)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
