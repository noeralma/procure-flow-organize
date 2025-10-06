import { useContext } from "react"
import { type AuthContextType } from "@/contexts/AuthContext"
import AuthContext from "@/contexts/AuthContext"

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default useAuth