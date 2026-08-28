import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getFilteredAuditLogs, getAuditSummaryStats } from '@/lib/services/auditService';
import { getProjects } from '@/lib/services/projectService';
import { getAllUsers } from '@/lib/services/userService';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userFilter = searchParams.get('user') || undefined;
    const categoryFilter = searchParams.get('category') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const [logs, stats, projects, users] = await Promise.all([
      getFilteredAuditLogs({ userFilter, categoryFilter, projectId, limit }),
      getAuditSummaryStats(),
      getProjects(),
      getAllUsers()
    ]);

    const projectMap = new Map<string, string>();
    projects.forEach((p: any) => {
      projectMap.set(p._id.toString(), p.name);
    });

    const formattedLogs = logs.map((log: any) => {
      const pId = log.projectId || log.metadata?.projectId || (log.entity === 'Project' ? log.entityId : undefined);
      const projectName = pId ? projectMap.get(pId.toString()) || 'General Site' : 'Global System';

      return {
        ...log,
        projectName
      };
    });

    return NextResponse.json({
      data: {
        logs: formattedLogs,
        stats,
        projects: projects.map((p: any) => ({ _id: p._id.toString(), name: p.name, code: p.code })),
        users: users.map((u: any) => ({ _id: u._id.toString(), name: u.name, email: u.email, role: u.role }))
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch audit monitoring feed.' },
      { status: 500 }
    );
  }
}
