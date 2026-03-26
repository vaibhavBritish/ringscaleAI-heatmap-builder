import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

async function getDB() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME || 'local_rank_heatmap')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const db = await getDB()
    
    const existingUser = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const user = {
      id: uuidv4(),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      plan: 'trial',
      credits: 5000, // Starting trial credits
      trialEndsAt: trialEndsAt,
      createdAt: now,
      updatedAt: now
    }

    await db.collection('users').insertOne(user)

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
