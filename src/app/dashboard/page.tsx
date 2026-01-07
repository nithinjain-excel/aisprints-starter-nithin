/**
 * Main Dashboard Page
 * 
 * Routes users based on their role:
 * - Instructors: Redirect to /dashboard/questions
 * - Students: Show "Coming Soon" message
 */

import { getSessionToken } from "@/lib/utils/cookies";
import { verifySession } from "@/lib/utils/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function DashboardPage() {
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
	
	// Redirect instructors to questions dashboard
	if (session.role === "instructor") {
		redirect("/dashboard/questions");
	}
	
	// Show "Coming Soon" for students
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
			<div className="w-full max-w-2xl">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<BookOpen className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-3xl">Coming Soon</CardTitle>
						<CardDescription className="text-base">
							Student quiz features are under development
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							Soon you&apos;ll be able to:
						</p>
						<ul className="space-y-2 text-left text-sm text-muted-foreground">
							<li className="flex items-start">
								<span className="mr-2">✓</span>
								<span>Take quizzes assigned by your instructors</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">✓</span>
								<span>View your quiz results and feedback</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">✓</span>
								<span>Track your progress over time</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">✓</span>
								<span>Access quiz history and scores</span>
							</li>
						</ul>
						<p className="pt-4 text-xs text-muted-foreground italic">
							MCQ practice features will be available soon!
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

