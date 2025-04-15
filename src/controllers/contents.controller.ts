import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllContents = async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
        return;
    }
    const contents = await prisma.content.findMany({
        where: {
            authorId: userId,
        },
    });

    res.status(200).json({
        success: true,
        message: "Contents fetched successfully",
        contents,
    });
}

export const createContent = async (req: Request, res: Response) => {
    const { contentLink, contentType } = req.body;
    if (!contentLink) {
        res.status(400).json({
            success: false,
            message: "Please provide content",
        });
        return;
    }
     await prisma.content.create({
        data: {
            content: contentLink,
            authorId: req.userId!,
            contentType: contentType,
        },
    });
}

export const deleteContent = async (req: Request, res: Response) => {
    res.json("Hello World!");
}