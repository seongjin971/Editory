import { notFound } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { getProject } from "@/lib/data";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <ProjectShell genre={project.genre} projectId={project.id} title={project.title}>
      {children}
    </ProjectShell>
  );
}
