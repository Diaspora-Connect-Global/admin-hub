import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  author: string;
  context: string;
  createdAt: string;
  preview: string;
}

const pendingPosts: Post[] = [
  { id: "POST-001", author: "Kwame Asante", context: "Belgian GH Network", createdAt: "10 min ago", preview: "Looking for business partners in..." },
  { id: "POST-002", author: "Ama Mensah", context: "Ghana Nurses Assoc.", createdAt: "25 min ago", preview: "Upcoming healthcare workshop..." },
  { id: "POST-003", author: "Kofi Owusu", context: "UK Diaspora", createdAt: "1 hour ago", preview: "Job opportunity in London for..." },
  { id: "POST-004", author: "Abena Darko", context: "US Connect", createdAt: "2 hours ago", preview: "Community meetup this weekend..." },
  { id: "POST-005", author: "Yaw Boateng", context: "Canada Network", createdAt: "3 hours ago", preview: "Scholarship announcement for..." },
];

export function PendingPosts() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Pending Posts</h3>
          <p className="text-sm text-muted-foreground">Posts awaiting approval</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {pendingPosts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground truncate">{post.author}</p>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-primary truncate">{post.context}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{post.preview}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{post.createdAt}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success hover:bg-success/10">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
