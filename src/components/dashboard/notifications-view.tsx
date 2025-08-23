"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppContext } from "@/contexts/app-context"
import { Bell, Send, Bold, Italic, Link, Eye, EyeOff, Crown, AlertCircle } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { UserRole } from "@/lib/types"
import { useState, useMemo } from "react"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"

// Rich text formatting parser
const parseFormattedText = (text: string) => {
  if (!text) return { __html: '' };
  
  let formatted = text
    // Bold: **text** or *text*
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    // Italic: _text_
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  return { __html: formatted };
};

// Formatting helper component
function FormattingHelp() {
  return (
    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-md">
      <p className="font-medium">Formatting Guide:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>**bold** or *bold*</div>
        <div>_italic_</div>
        <div>[link text](url)</div>
        <div>Line breaks: Enter twice</div>
      </div>
    </div>
  );
}


function BroadcastForm() {
    const { user, allUsers, handleBroadcastNotification } = useAppContext();
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'role' | 'user'>('role');
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return allUsers;
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    if (user?.role !== 'super_agent') return null;

    const handleSend = () => {
        if (!message) return;
        const targetUser = targetType === 'user' ? selectedUserId : undefined;
        const targetRole = targetType === 'role' ? selectedRole : undefined;
        handleBroadcastNotification(message, targetRole, targetUser);
        setMessage('');
        setShowPreview(false);
    }

    const insertFormatting = (prefix: string, suffix: string = '') => {
        const textarea = document.querySelector('#message-textarea') as HTMLTextAreaElement;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = message.substring(start, end);
        const beforeText = message.substring(0, start);
        const afterText = message.substring(end);
        
        const newText = beforeText + prefix + selectedText + suffix + afterText;
        setMessage(newText);
        
        // Focus back to textarea and set cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Send a Broadcast</CardTitle>
                <CardDescription>Send a notification to all users of a specific role or to an individual user. Use rich formatting for better communication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Formatting toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => insertFormatting('**', '**')}
                            className="h-8 px-2"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => insertFormatting('_', '_')}
                            className="h-8 px-2"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => insertFormatting('[Link Text](', ')')}
                            className="h-8 px-2"
                        >
                            <Link className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="h-8 px-3"
                    >
                        {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showPreview ? 'Edit' : 'Preview'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHelp(!showHelp)}
                        className="h-8 px-3 text-xs"
                    >
                        Help
                    </Button>
                </div>

                {/* Formatting help */}
                {showHelp && <FormattingHelp />}

                {/* Message input/preview */}
                {showPreview ? (
                    <div className="min-h-[100px] p-3 border rounded-md bg-background">
                        <Label className="text-sm font-medium mb-2 block">Preview:</Label>
                        <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={parseFormattedText(message)}
                        />
                    </div>
                ) : (
                    <Textarea 
                        id="message-textarea"
                        placeholder="Your message... Use **bold**, _italic_, [links](url), and line breaks for formatting."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px]"
                    />
                )}
                <div className="flex items-end gap-4">
                    <div className="flex-grow space-y-2">
                        <Label>Target</Label>
                        <Select value={targetType} onValueChange={(v: 'role' | 'user') => setTargetType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="role">By Role</SelectItem>
                                <SelectItem value="user">By User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {targetType === 'role' ? (
                        <div className="flex-grow space-y-2">
                            <Label>Role</Label>
                             <Select value={selectedRole} onValueChange={(v: UserRole) => setSelectedRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Students</SelectItem>
                                    <SelectItem value="agent">Agents</SelectItem>
                                    <SelectItem value="worker">Workers</SelectItem>
                                    <SelectItem value="super_worker">Super Workers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                         <div className="flex-grow space-y-2">
                            <Label>User</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user..." />
                                </SelectTrigger>
                                <SelectContent>
                                     <div className="p-2">
                                        <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <ScrollArea className="h-48">
                                    {filteredUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                                    ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                 <Button onClick={handleSend} disabled={!message || (targetType === 'user' && !selectedUserId)}>
                    <Send className="mr-2"/> Send Notification
                </Button>
            </CardContent>
        </Card>
    )
}


export default function NotificationsView() {
    const { notifications } = useAppContext();

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-4">
                            {notifications.length > 0 ? notifications.map(n => {
                                const isBroadcast = n.source === 'broadcast';
                                const isSystem = n.source === 'system' || !n.source;
                                
                                return (
                                <div key={n.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                                    isBroadcast 
                                        ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-md'
                                        : 'bg-card border-border'
                                }`}>
                                     {!n.is_read && <div className="w-2 h-2 mt-2 rounded-full bg-accent animate-pulse" />}
                                     
                                     {/* Special icon for broadcast notifications */}
                                     {isBroadcast && (
                                         <div className="p-2 rounded-full bg-primary/20 border border-primary/30">
                                             <Crown className="h-4 w-4 text-primary" />
                                         </div>
                                     )}
                                     
                                     <div className={`flex-1 ${n.is_read ? 'text-muted-foreground' : ''}`}>
                                        {/* Notification tags */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {isBroadcast && (
                                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2 py-1">
                                                    <Crown className="h-3 w-3 mr-1" />
                                                    Super Agent Broadcast
                                                </Badge>
                                            )}
                                            {isSystem && (
                                                <Badge variant="outline" className="text-xs px-2 py-1">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    System Notification
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div 
                                            className={`prose prose-sm max-w-none leading-relaxed ${
                                                isBroadcast ? 'font-medium' : ''
                                            }`}
                                            dangerouslySetInnerHTML={parseFormattedText(n.message)}
                                        />
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                                            {!n.is_read && (
                                                <Badge variant="secondary" className="text-xs px-2 py-0">New</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                )
                            }) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                                    <p>No new notifications.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <BroadcastForm />
        </div>
    )
}
