import { Construction } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground max-w-md">
          {description || "This screen is under development and will be available soon."}
        </p>
      </div>
    </AdminLayout>
  );
}
