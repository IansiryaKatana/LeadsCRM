import { useState } from "react";
import { Loader2, MessageSquare, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LeadNoteContent } from "@/components/leads/LeadNoteContent";
import {
  useLeadNotes,
  useCreateLeadNote,
  useUpdateLeadNote,
  useDeleteLeadNote,
} from "@/hooks/useLeadNotes";
import { useAuth } from "@/hooks/useAuth";
import { pageTitleClass, subsectionTitleClass } from "@/lib/typography";

interface LeadNotesTabProps {
  leadId: string;
}

type LeadNoteRow = {
  id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  profiles?: { full_name: string };
};

function canModifyNote(
  note: LeadNoteRow,
  userId: string | undefined,
  hasElevatedRole: boolean,
) {
  if (hasElevatedRole) return true;
  return !!userId && note.created_by === userId;
}

export function LeadNotesTab({ leadId }: LeadNotesTabProps) {
  const { user, hasElevatedRole } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const { data: notes = [], isLoading: notesLoading } = useLeadNotes(leadId);
  const createNote = useCreateLeadNote();
  const updateNote = useUpdateLeadNote();
  const deleteNote = useDeleteLeadNote();

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate(
      { leadId, note: newNote },
      {
        onSuccess: () => setNewNote(""),
      },
    );
  };

  const startEditing = (note: LeadNoteRow) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const saveEdit = () => {
    if (!editingNoteId || !editingText.trim()) return;
    updateNote.mutate(
      { noteId: editingNoteId, leadId, note: editingText.trim() },
      {
        onSuccess: () => {
          setEditingNoteId(null);
          setEditingText("");
        },
      },
    );
  };

  const handleDelete = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote.mutate({ noteId: noteToDelete, leadId });
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      if (editingNoteId === noteToDelete) {
        cancelEditing();
      }
    }
  };

  const renderNoteActions = (note: LeadNoteRow, canModify: boolean) => {
    if (!canModify) return null;

    return (
      <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => startEditing(note)}
          aria-label="Edit note"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => handleDelete(note.id)}
          disabled={deleteNote.isPending}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderEditingForm = () => (
    <div className="space-y-3">
      <Textarea
        value={editingText}
        onChange={(e) => setEditingText(e.target.value)}
        rows={4}
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={saveEdit}
          disabled={!editingText.trim() || updateNote.isPending}
        >
          {updateNote.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={cancelEditing}
          disabled={updateNote.isPending}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className={subsectionTitleClass}>Notes</h3>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || createNote.isPending}
            size="sm"
            className="w-full"
          >
            {createNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </div>

        {notesLoading && notes.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading notes...</span>
            </div>
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="absolute h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] bg-primary/50" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead>Note</TableHead>
                    <TableHead className="w-36">Author</TableHead>
                    <TableHead className="w-44">Created</TableHead>
                    <TableHead className="w-20 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    const canModify = canModifyNote(note, user?.id, hasElevatedRole);

                    if (isEditing) {
                      return (
                        <TableRow key={note.id}>
                          <TableCell colSpan={4} className="py-4">
                            {renderEditingForm()}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow key={note.id} className="group align-top">
                        <TableCell className="py-3 max-w-[400px]">
                          <LeadNoteContent note={note.note} />
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground truncate">
                          {note.profiles?.full_name || (note.created_by ? "Unknown" : "System")}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(note.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 pr-4">
                          {renderNoteActions(note, canModify)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {notes.map((note) => {
                const isEditing = editingNoteId === note.id;
                const canModify = canModifyNote(note, user?.id, hasElevatedRole);

                return (
                  <div
                    key={note.id}
                    className="group rounded-lg border border-border bg-muted/50 p-4"
                  >
                    {isEditing ? (
                      renderEditingForm()
                    ) : (
                      <>
                        <LeadNoteContent note={note.note} />
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                          <p className="text-xs text-muted-foreground">
                            {note.profiles?.full_name || (note.created_by ? "Unknown" : "System")} •{" "}
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                          {renderNoteActions(note, canModify)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={pageTitleClass}>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
