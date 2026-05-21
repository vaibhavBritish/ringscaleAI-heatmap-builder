import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    // Only fetch published blogs for the public route
    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        author: true,
        createdAt: true,
        // Exclude full content to save bandwidth on listing page
      }
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching public blogs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
