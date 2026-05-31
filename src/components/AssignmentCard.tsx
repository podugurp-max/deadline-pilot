import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Assignment, Difficulty } from "@/lib/recovery-engine";

interface Props {
  assignment: Assignment;
  index: number;
  onChange: (a: Assignment) => void;
  onRemove: () => void;
}

export function AssignmentCard({ assignment, index, onChange, onRemove }: Props) {
  const update = <K extends keyof Assignment>(k: K, v: Assignment[K]) =>
    onChange({ ...assignment, [k]: v });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Assignment #{index + 1}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor={`name-${assignment.id}`}>Assignment name</Label>
          <Input
            id={`name-${assignment.id}`}
            value={assignment.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Essay on Hamlet"
          />
        </div>
        <div>
          <Label htmlFor={`course-${assignment.id}`}>Course</Label>
          <Input
            id={`course-${assignment.id}`}
            value={assignment.course}
            onChange={(e) => update("course", e.target.value)}
            placeholder="e.g. ENGL 201"
          />
        </div>
        <div>
          <Label htmlFor={`due-${assignment.id}`}>Due date / time</Label>
          <Input
            id={`due-${assignment.id}`}
            type="datetime-local"
            value={assignment.dueAt}
            onChange={(e) => update("dueAt", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`hours-${assignment.id}`}>Hours remaining</Label>
          <Input
            id={`hours-${assignment.id}`}
            type="number"
            min={0}
            step={0.25}
            value={assignment.hoursRemaining}
            onChange={(e) => update("hoursRemaining", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor={`weight-${assignment.id}`}>Grade weight / importance (%)</Label>
          <Input
            id={`weight-${assignment.id}`}
            type="number"
            min={0}
            max={100}
            value={assignment.weight}
            onChange={(e) => update("weight", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor={`progress-${assignment.id}`}>Progress (%)</Label>
          <Input
            id={`progress-${assignment.id}`}
            type="number"
            min={0}
            max={100}
            value={assignment.progress}
            onChange={(e) => update("progress", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select
            value={assignment.difficulty}
            onValueChange={(v) => update("difficulty", v as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`notes-${assignment.id}`}>Notes</Label>
          <Textarea
            id={`notes-${assignment.id}`}
            value={assignment.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Stuck on intro, professor accepts late work, etc."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
