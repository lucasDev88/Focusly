import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";

export async function createGoal(req: Request, res: Response) {
  try {
    const {
      subjectId,
      title,
      targetMinutes,
      period,
      startDate,
      endDate,
    } = req.body;

    const userId = req.userId

    if (!userId) {
      return res.status(401).json(
        {
          status: "error",
          message: "Authentication required."
        }
      )
    }

    if (
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

    if (subjectId !== undefined && subjectId !== null) {
      if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid subjectId",
        });
      }
    }

    if (subjectId !== undefined && subjectId !== null) {
      const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        userId,
      },
    });

    if (!subject) {
      return res.status(404).json({
          status: "error",
          message: "Subject not found",
        });
      }
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
    const userId = req.userId

    if (!userId) {
      return res.status(401).json(
        {
          status: "error",
          message: "Authentication required."
        }
      )
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
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
    const userId = req.userId

    if (!userId) {
      return res.status(401).json(
        {
          status: "error",
          message: "Authentication required"
        }
      )
    }
    
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId
      },
      include: {
        subject: true
      }
    })

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

    const userId = req.userId

    if (!userId) {
      return res.status(401).json(
        {
          status: "error",
          message: "Authentication required"
        }
      )
    }

    const existingGoal = await prisma.goal.findUnique({
      where: {
          id,
          userId
        },
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
          where: {
            id: subjectId,
            userId
          },
        });

        if (!subject) {
          return res.status(404).json({
            status: "error",
            message: "Subject not found.",
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

    const userId = req.userId

    if (!userId) {
      return res.status(401).json(
        {
          status: "error",
          message: "Authentication required"
        }
      )
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id,
        userId
      },
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

        const userId = req.userId

        if (!userId) {
          return res.status(401).json(
            {
              status: "error",
              message: "Authentication required"
            }
          )
        }

        const goal = await prisma.goal.findUnique({
            where: {
              id,
              userId
            },
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