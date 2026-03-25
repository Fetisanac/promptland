import { NextResponse } from "next/server"
import { fixStoragePolicies } from "@/lib/fix-storage"

/**
 * API endpoint to fix storage policies
 * GET /api/fix-storage
 */
export async function GET() {
  try {
    const result = await fixStoragePolicies()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Storage politikaları başarıyla ayarlandı" 
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Bilinmeyen hata" 
      },
      { status: 500 }
    )
  }
}











