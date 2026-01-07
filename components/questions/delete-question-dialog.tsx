"use client";

/**
 * Delete Question Confirmation Dialog
 * 
 * A reusable dialog component for confirming question deletion.
 * Displays the question title and requires explicit user confirmation.
 */

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteQuestionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	questionTitle: string;
	onConfirm: () => void;
	isDeleting: boolean;
}

export function DeleteQuestionDialog({
	open,
	onOpenChange,
	questionTitle,
	onConfirm,
	isDeleting,
}: DeleteQuestionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Question?</DialogTitle>
					<DialogDescription className="pt-2">
						Are you sure you want to delete{" "}
						<span className="font-semibold text-foreground">&ldquo;{questionTitle}&rdquo;</span>?
						<br />
						<br />
						This action cannot be undone. This will permanently delete the question and all
						associated choices.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

