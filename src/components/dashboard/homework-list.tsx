"use client"
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { HomeworkStatus } from "@/lib/types";
import { useEffect } from "react";

const statusColors: Record<HomeworkStatus, string> = {
  payment_approval: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  requested_changes: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  final_payment_approval: "bg-green-500/20 text-green-700 border-green-500/30",
  word_count_change: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  deadline_change: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
  declined: "bg-red-500/20 text-red-700 border-red-500/30",
  refund: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  completed: "bg-teal-500/20 text-teal-700 border-teal-500/30",
};

export default function HomeworkList() {
    const { user, homeworks, getHomeworksForUser, setSelectedHomework, setIsHomeworkModalOpen } = useAppContext();

    useEffect(() => {
        if (user) {
            getHomeworksForUser(user);
        }
    }, [user, getHomeworksForUser]);


    if (!user) return null;

    const openHomeworkModal = (homeworkId: string) => {
        const homework = homeworks.find(h => h.id === homeworkId);
        if (homework) {
            setSelectedHomework(homework);
            setIsHomeworkModalOpen(true);
        }
    }

    return (
        <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {homeworks.length > 0 ? homeworks.map(hw => (
                    <Card 
                        key={hw.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                        onClick={() => openHomeworkModal(hw.id)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">#{hw.id.split('_')[1]}</CardTitle>
                                <Badge variant="outline" className={cn("capitalize", statusColors[hw.status])}>
                                    {hw.status.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            <CardDescription>{hw.moduleName}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">Deadline: {new Date(hw.deadline).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">Words: {hw.wordCount}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">View Details</Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        <p>No homework assignments found.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
