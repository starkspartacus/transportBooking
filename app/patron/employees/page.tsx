import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import EmployeeManagement from "@/components/patron/employee-management"

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !["ADMIN", "PATRON"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <EmployeeManagement />
      </div>
    </div>
  )
}
