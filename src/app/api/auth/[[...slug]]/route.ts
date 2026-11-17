import { NextRequest } from "next/server"
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/server/auth"

const handler = toNextJsHandler(auth.handler)

export async function GET(request: NextRequest) {
  return handler.GET(request)
}
export async function POST(request: NextRequest) {
  return handler.POST(request)
}
export async function PATCH(request: NextRequest) {
  return handler.PATCH(request)
}
export async function PUT(request: NextRequest) {
  return handler.PUT(request)
}
export async function DELETE(request: NextRequest) {
  return handler.DELETE(request)
}
