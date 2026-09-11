import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";

export async function createGoal(req: Request, res: Response) {
  try {
    const {
      userId,
      subjectId,
      title,
      targetMinutes,
      period,
      startDate,
      endDate,
    } = req.body;

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !title ||
      !Number.isInteger(targetMinutes) ||
      !["DAILY", "WEEKLY", "MONTHLY"].includes(period) ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid goal data.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (subjectId !== undefined && subjectId !== null) {
      if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid subjectId",
        });
      }
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return res.status(404).json({
        status: "error",
        message: "Subject not found",
      });
    }

    if (subject.userId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Subject does not belong to user.",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime()) ||
      parsedEndDate <= parsedStartDate
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid date range",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        subjectId: subjectId ?? null,
        title,
        targetMinutes,
        period,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });

    return res.status(201).json({
      status: "ok",
      goal,
    });
  } catch (err) {
    console.log("Error creating goal: ", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to create goal, Internal Server Error.",
    });
  }
}

export async function getUserGoals(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid userId",
      });
    }

    const goals = await prisma.goal.findMany({
      where: { userId: userId },
      include: {
        subject: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return res.status(200).json({
      status: "ok",
      goals,
    });
  } catch (err) {
    console.error("Error fetching user goals: ", err);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch user goals, Internal Server Error",
    });
  }
}

export const getGoalById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid goal id.",
      });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        subject: true,
      },
    });

    if (!goal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found.",
      });
    }

    return res.json({
      status: "success",
      goal,
    });
  } catch (error) {
    console.error("Error fetching goal:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid goal id.",
      });
    }

    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found.",
      });
    }

    const { title, targetMinutes, period, subjectId, startDate, endDate } =
      req.body;

    const data: Prisma.GoalUpdateInput = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          status: "error",
          message: "Invalid title.",
        });
      }

      data.title = title;
    }

    if (targetMinutes !== undefined) {
      if (!Number.isInteger(targetMinutes) || targetMinutes <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid targetMinutes.",
        });
      }

      data.targetMinutes = targetMinutes;
    }

    if (period !== undefined) {
      if (!["DAILY", "WEEKLY", "MONTHLY"].includes(period)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid period.",
        });
      }

      data.period = period;
    }

    if (subjectId !== undefined) {
      if (subjectId !== null) {
        if (!Number.isInteger(subjectId) || subjectId <= 0) {
          return res.status(400).json({
            status: "error",
            message: "Invalid subjectId.",
          });
        }

        const subject = await prisma.subject.findUnique({
          where: { id: subjectId },
        });

        if (!subject) {
          return res.status(404).json({
            status: "error",
            message: "Subject not found.",
          });
        }

        if (subject.userId !== existingGoal.userId) {
          return res.status(403).json({
            status: "error",
            message: "Subject does not belong to user.",
          });
        }
      }

      data.subject =
        subjectId === null
          ? { disconnect: true }
          : { connect: { id: subjectId } };
    }

    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);

      if (Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid startDate.",
        });
      }

      data.startDate = parsedStartDate;
    }

    if (endDate !== undefined) {
      const parsedEndDate = new Date(endDate);

      if (Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid endDate.",
        });
      }

      data.endDate = parsedEndDate;
    }

    const finalStartDate = data.startDate ?? existingGoal.startDate;
    const finalEndDate = data.endDate ?? existingGoal.endDate;

    if (finalEndDate <= finalStartDate) {
      return res.status(400).json({
        status: "error",
        message: "Invalid date range.",
      });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data,
    });

    return res.json({
      status: "success",
      goal,
    });
  } catch (error) {
    console.error("Error updating goal:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid goal id.",
      });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found.",
      });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return res.json({
      status: "success",
      message: "Goal deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting goal:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const getGoalProgress = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid goal id.',
            });
        }

        const goal = await prisma.goal.findUnique({
            where: { id },
        });

        if (!goal) {
            return res.status(404).json({
                status: 'error',
                message: 'Goal not found.',
            });
        }

        const sessions = await prisma.studySession.findMany({
            where: {
                userId: goal.userId,
                subjectId: goal.subjectId ?? undefined,
                status: 'COMPLETED',
                startedAt: {
                    gte: goal.startDate,
                    lte: goal.endDate,
                },
            },
            select: {
                duration: true,
            },
        });

        const studiedSeconds = sessions.reduce(
            (total, session) => total + (session.duration ?? 0),
            0
        );

        const studiedMinutes = Math.floor(studiedSeconds / 60);

        const remainingMinutes = Math.max(
            goal.targetMinutes - studiedMinutes,
            0
        );

        const percentage = Math.min(
            (studiedMinutes / goal.targetMinutes) * 100,
            100
        );

        return res.json({
            status: 'success',
            progress: {
                targetMinutes: goal.targetMinutes,
                studiedMinutes,
                remainingMinutes,
                percentage: Number(percentage.toFixed(2)),
            },
        });
    } catch (error) {
        console.error('Error calculating goal progress:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.',
        });
    }
};