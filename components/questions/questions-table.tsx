"use client";

/**
 * Questions Table Component
 * 
 * Displays a paginated, sortable table of MCQ questions.
 * Features:
 * - Pagination (10 items per page)
 * - Sorting by columns
 * - Action menu for each question
 * - Delete confirmation dialog
 * - Loading skeleton
 * - Empty state
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { DeleteQuestionDialog } from "./delete-question-dialog";

interface Question {
	id: string;
	title: string;
	description: string | null;
	questionText: string;
	questionType: string;
	createdAt: string;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

interface QuestionsResponse {
	success: boolean;
	questions: Question[];
	pagination: PaginationInfo;
	message?: string;
}

interface DeleteResponse {
	success: boolean;
	message?: string;
}

type SortColumn = "title" | "questionText" | "createdAt";
type SortOrder = "asc" | "desc";

export function QuestionsTable() {
	const router = useRouter();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: 10,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<SortColumn>("createdAt");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch questions
	const fetchQuestions = async (page: number = 1) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/v1/questions?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`
			);

			if (!response.ok) {
				throw new Error("Failed to fetch questions");
			}

			const data = (await response.json()) as QuestionsResponse;

			if (data.success) {
				setQuestions(data.questions);
				setPagination(data.pagination);
			} else {
				toast.error("Failed to load questions");
			}
		} catch (error) {
			console.error("Error fetching questions:", error);
			toast.error("Failed to load questions");
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch on mount and when sort/page changes
	useEffect(() => {
		fetchQuestions(pagination.currentPage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortBy, sortOrder]);

	// Handle sort column click
	const handleSort = (column: SortColumn) => {
		if (sortBy === column) {
			// Toggle order if same column
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			// New column, default to ascending
			setSortBy(column);
			setSortOrder("asc");
		}
	};

	// Handle pagination
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= pagination.totalPages) {
			setPagination({ ...pagination, currentPage: newPage });
			fetchQuestions(newPage);
		}
	};

	// Handle delete
	const handleDeleteClick = (question: Question) => {
		setQuestionToDelete(question);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!questionToDelete) return;

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/v1/questions/${questionToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete question");
			}

			const data = (await response.json()) as DeleteResponse;

			if (data.success) {
				toast.success("Question deleted successfully");
				setDeleteDialogOpen(false);
				setQuestionToDelete(null);
				
				// Refresh the list
				// If we deleted the last item on a page, go to previous page
				if (questions.length === 1 && pagination.currentPage > 1) {
					handlePageChange(pagination.currentPage - 1);
				} else {
					fetchQuestions(pagination.currentPage);
				}
			} else {
				toast.error(data.message || "Failed to delete question");
			}
		} catch (error) {
			console.error("Error deleting question:", error);
			toast.error("Failed to delete question");
		} finally {
			setIsDeleting(false);
		}
	};

	// Truncate text helper
	const truncate = (text: string, maxLength: number = 50) => {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + "...";
	};

	// Format date helper
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Get sort indicator
	const getSortIndicator = (column: SortColumn) => {
		if (sortBy !== column) return null;
		return sortOrder === "asc" ? " ↑" : " ↓";
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<CardTitle className="text-2xl font-bold">My Questions</CardTitle>
					<Button onClick={() => router.push("/dashboard/questions/create")}>
						<Plus className="mr-2 h-4 w-4" />
						Create Question
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						// Loading skeleton
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex items-center space-x-4">
									<Skeleton className="h-12 w-full" />
								</div>
							))}
						</div>
					) : questions.length === 0 ? (
						// Empty state
						<div className="text-center py-12">
							<p className="text-muted-foreground mb-4">
								No questions yet. Create your first question!
							</p>
							<Button onClick={() => router.push("/dashboard/questions/create")}>
								<Plus className="mr-2 h-4 w-4" />
								Create Question
							</Button>
						</div>
					) : (
						// Questions table
						<>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead
												className="cursor-pointer hover:bg-muted/50"
												onClick={() => handleSort("title")}
											>
												Title{getSortIndicator("title")}
											</TableHead>
											<TableHead>Description</TableHead>
											<TableHead
												className="cursor-pointer hover:bg-muted/50"
												onClick={() => handleSort("questionText")}
											>
												Question{getSortIndicator("questionText")}
											</TableHead>
											<TableHead>Type</TableHead>
											<TableHead
												className="cursor-pointer hover:bg-muted/50"
												onClick={() => handleSort("createdAt")}
											>
												Created{getSortIndicator("createdAt")}
											</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{questions.map((question) => (
											<TableRow key={question.id}>
												<TableCell className="font-medium">
													{truncate(question.title, 40)}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{question.description
														? truncate(question.description, 40)
														: "—"}
												</TableCell>
												<TableCell>
													{truncate(question.questionText, 50)}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{question.questionType === "mcq_single"
															? "MCQ"
															: question.questionType}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(question.createdAt)}
												</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="h-4 w-4" />
																<span className="sr-only">Open menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() =>
																	router.push(
																		`/dashboard/questions/${question.id}/preview`
																	)
																}
															>
																<Eye className="mr-2 h-4 w-4" />
																Preview
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	router.push(
																		`/dashboard/questions/${question.id}/edit`
																	)
																}
															>
																<Pencil className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDeleteClick(question)}
																className="text-destructive focus:text-destructive"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{pagination.totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<p className="text-sm text-muted-foreground">
										Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
										{Math.min(
											pagination.currentPage * pagination.itemsPerPage,
											pagination.totalItems
										)}{" "}
										of {pagination.totalItems} questions
									</p>
									<div className="flex items-center space-x-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(pagination.currentPage - 1)}
											disabled={pagination.currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4 mr-1" />
											Previous
										</Button>
										<span className="text-sm">
											Page {pagination.currentPage} of {pagination.totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(pagination.currentPage + 1)}
											disabled={pagination.currentPage === pagination.totalPages}
										>
											Next
											<ChevronRight className="h-4 w-4 ml-1" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Delete confirmation dialog */}
			<DeleteQuestionDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				questionTitle={questionToDelete?.title || ""}
				onConfirm={handleDeleteConfirm}
				isDeleting={isDeleting}
			/>
		</>
	);
}

