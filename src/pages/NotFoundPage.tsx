import { NotFoundBlock } from "@/components/ui/NotFoundBlock";

export default function NotFoundPage() {
  return (
    <NotFoundBlock
      title="Page not found"
      description="The page you are looking for does not exist, or it has been moved."
      showProjectsLink
    />
  );
}
