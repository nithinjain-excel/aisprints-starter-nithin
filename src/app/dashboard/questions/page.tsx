/**
 * MCQ Questions Dashboard Page
 * 
 * Main dashboard for instructors to view and manage their MCQ questions.
 * Features:
 * - Paginated table of questions (10 per page)
 * - Sortable columns
 * - Action menu (Preview, Edit, Delete)
 * - Create new question button
 * - Loading and empty states
 */

import { getSessionToken } from "@/lib/utils/cookies";
import { verifySession } from "@/lib/utils/session";
import { getUserById } from "@/lib/services/auth-service";
import { redirect } from "next/navigation";
import { QuestionsTable } from "@/components/questions/questions-table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function QuestionsPage() {
	// Get session token
	const token = await getSessionToken();
	
	if (!token) {
		redirect("/login");
	}
	
	// Verify session
	const session = await verifySession(token);
	
	if (!session) {
		redirect("/login");
	}
	
	// Check if user is an instructor
	if (session.role !== "instructor") {
		redirect("/dashboard");
	}

	// Get user data for display
	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}
	
	return (
		<DashboardLayout user={user}>
			<QuestionsTable />
		</DashboardLayout>
	);
}

