import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/services/userService';
import { getFilteredAuditLogs } from '@/lib/services/auditService';
import { getProjects } from '@/lib/services/projectService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const [allLogs, projects] = await Promise.all([
      getFilteredAuditLogs({ userFilter: user.name, limit: 150 }),
      getProjects()
    ]);

    const projectMap = new Map<string, string>();
    projects.forEach((p: any) => {
      projectMap.set(p._id.toString(), p.name);
    });

    const userLogs = allLogs.filter((log: any) => {
      if (!log.user) return false;
      const uLower = log.user.toLowerCase();
      return uLower.includes(user.name.toLowerCase()) || uLower.includes(user.email.toLowerCase());
    });

    let totalExpensesAmount = 0;
    let expenseCount = 0;
    let progressUpdateCount = 0;
    let lastLoginTime: string | null = null;

    const formattedActivities = userLogs.map((log: any) => {
      const pId = log.projectId || log.metadata?.projectId || (log.entity === 'Project' ? log.entityId : undefined);
      const projectName = pId ? projectMap.get(pId.toString()) || 'Site Project' : 'Global System';

      if (log.action === 'EXPENSE_CREATED') {
        expenseCount++;
        totalExpensesAmount += Number(log.metadata?.amount || 0);
      } else if (log.action === 'WORK_PROGRESS_UPDATED') {
        progressUpdateCount++;
      } else if (log.action === 'USER_LOGIN_SUCCESS' && !lastLoginTime) {
        lastLoginTime = log.timestamp;
      }

      return {
        _id: log._id,
        user: log.user,
        action: log.action,
        entity: log.entity,
        projectName,
        timestamp: log.timestamp,
        metadata: log.metadata || {}
      };
    });

    const assignedProjects = projects.filter((p: any) =>
      (user.assignedProjectIds || []).map((id: any) => id.toString()).includes(p._id.toString())
    );

    return NextResponse.json({
      data: {
        user,
        assignedProjects,
        metrics: {
          totalActions: userLogs.length,
          expenseCount,
          totalExpensesAmount,
          progressUpdateCount,
          lastLoginTime
        },
        activities: formattedActivities
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user activity history.' },
      { status: 500 }
    );
  }
}
