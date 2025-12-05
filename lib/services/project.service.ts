import { prisma } from '@/lib/db/prisma'

export class ProjectService {
  async createProject(
    name: string,
    description: string | undefined,
    userId: string
  ) {
    return await prisma.project.create({
      data: {
        name,
        description,
        createdById: userId
      }
    })
  }

  async getProject(projectId: string, userId: string) {
    return await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: userId
      },
      select: {
        id: true,
        name: true,
        description: true,
        shareId: true,
        isPublic: true,
        createdAt: true,
        files: {
          select: {
            id: true,
            name: true,
            path: true,
            language: true,
            size: true,
            createdAt: true
          }
        }
      }
    })
  }

  async getUserProjects(userId: string) {
    return await prisma.project.findMany({
      where: {
        createdById: userId
      },
      include: {
        _count: {
          select: {
            files: true,
            conversations: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  async updateProject(
    projectId: string,
    userId: string,
    data: { name?: string; description?: string }
  ) {
    return await prisma.project.update({
      where: {
        id: projectId,
        createdById: userId
      },
      data
    })
  }

  async deleteProject(projectId: string, userId: string) {
    await prisma.project.delete({
      where: {
        id: projectId,
        createdById: userId
      }
    })
  }
}

export const projectService = new ProjectService()
