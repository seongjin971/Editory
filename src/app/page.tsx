import { redirect } from "next/navigation";
import { getDashboardProjects } from "@/lib/data";

export default async function HomePage() {
  const projects = await getDashboardProjects();
  const recentProject = projects[0];

  if (!recentProject) {
    redirect("/dashboard");
  }

  redirect(`/projects/${recentProject.id}/write`);
}
