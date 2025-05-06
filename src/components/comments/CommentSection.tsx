
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, ArrowDown, ArrowUp, Ban, MessageSquareX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  Timestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { blockUser } from "@/services/userService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reaction {
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
  count: number;
  userIds: string[];
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
  isReply?: boolean;
  parentId?: string;
  reactions?: Reaction[];
  isBlocked?: boolean;
  isReported?: boolean;
}

interface CommentSectionProps {
  newsId: string;
  onCommentCountChange?: (count: number) => void;
}

const CommentSection = ({ newsId, onCommentCountChange }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{userId: string, commentId: string} | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!newsId) return;

    // Set up real-time listener for comments
    const commentsQuery = query(
      collection(db, "comments"),
      where("newsId", "==", newsId),
      where("isReply", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        commentsList.map(async (comment) => {
          const repliesQuery = query(
            collection(db, "comments"),
            where("parentId", "==", comment.id),
            orderBy("createdAt", "asc")
          );
          
          const repliesSnapshot = await getDocs(repliesQuery);
          const replies = repliesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Comment));
          
          return {
            ...comment,
            replies
          };
        })
      );
      
      setComments(commentsWithReplies as Comment[]);
      
      // Count total comments including replies
      let totalComments = commentsList.length;
      commentsWithReplies.forEach(comment => {
        if ((comment as any).replies) {
          totalComments += (comment as any).replies.length;
        }
      });
      
      // Update comment count
      if (onCommentCountChange) {
        onCommentCountChange(totalComments);
      }
    });

    return () => unsubscribe();
  }, [newsId, onCommentCountChange]);

  const handleCommentSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to comment",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please write something to comment",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "comments"), {
        text: newComment,
        newsId,
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
        isReply: false,
        reactions: []
      });

      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been posted"
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to reply",
        variant: "destructive"
      });
      return;
    }

    if (!replyText[parentId]?.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please write something to reply",
        variant: "destructive"
      });
      return;
    }

    try {
      await addDoc(collection(db, "comments"), {
        text: replyText[parentId],
        newsId,
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
        isReply: true,
        parentId,
        reactions: []
      });

      // Clear reply text and close reply form
      setReplyText(prev => ({ ...prev, [parentId]: "" }));
      setReplyingTo(null);
      
      // Show replies after replying
      setShowReplies(prev => ({ ...prev, [parentId]: true }));

      toast({
        title: "Reply Added",
        description: "Your reply has been posted"
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      toast({
        title: "Error",
        description: "Failed to post your reply",
        variant: "destructive"
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({ 
      ...prev, 
      [commentId]: !prev[commentId] 
    }));
  };

  const openReplyForm = (commentId: string) => {
    setReplyingTo(commentId);
    if (!replyText[commentId]) {
      setReplyText(prev => ({ ...prev, [commentId]: "" }));
    }
  };

  const handleReport = async (commentId: string, userId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to report",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update comment to mark as reported
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, { 
        isReported: true,
        reportedBy: user.uid,
        reportedAt: serverTimestamp()
      });
      
      // Also create a notification for admins
      await addDoc(collection(db, "notifications"), {
        type: "comment_report",
        commentId,
        userId,
        reportedBy: user.uid,
        reporterName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(),
        read: false,
        newsId
      });
      
      toast({
        title: "Comment Reported",
        description: "Admins will review this comment"
      });
    } catch (error) {
      console.error("Error reporting comment:", error);
      toast({
        title: "Error",
        description: "Failed to report comment",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = () => {
    if (!userToBlock || !user) return;
    
    blockUser(userToBlock.userId)
      .then(() => {
        toast({
          title: "User Blocked",
          description: "This user has been blocked"
        });
        
        // Also create a notification for admins
        addDoc(collection(db, "notifications"), {
          type: "user_blocked",
          blockedUserId: userToBlock.userId,
          blockedByUserId: user.uid,
          blockerName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          createdAt: serverTimestamp(),
          read: false
        });
      })
      .catch((error) => {
        console.error("Error blocking user:", error);
        toast({
          title: "Error",
          description: "Failed to block user",
          variant: "destructive"
        });
      })
      .finally(() => {
        setBlockDialogOpen(false);
        setUserToBlock(null);
      });
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "Just now";
    }
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // difference in seconds
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
      </div>
      
      {user ? (
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
            ) : (
              <AvatarFallback>
                {getUserInitials(user.displayName || user.email?.split('@')[0] || 'U')}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              className="mb-2"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleCommentSubmit} 
                disabled={isLoading || !newComment.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isLoading ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 p-4 rounded-md text-center">
          <p className="mb-2">Login to join the conversation</p>
          <Button variant="outline">Login</Button>
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="animate-fade-in">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  {comment.userPhotoURL ? (
                    <AvatarImage src={comment.userPhotoURL} alt={comment.userDisplayName} />
                  ) : (
                    <AvatarFallback>
                      {getUserInitials(comment.userDisplayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{comment.userDisplayName}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                  
                  {/* Comment actions */}
                  <div className="flex gap-4 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-0 px-1"
                      onClick={() => openReplyForm(comment.id)}
                    >
                      Reply
                    </Button>
                    
                    {/* Only show if the comment has replies */}
                    {(comment as any).replies && (comment as any).replies.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-auto py-0 px-1 flex items-center gap-1"
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {showReplies[comment.id] ? (
                          <>
                            <ArrowUp className="h-3 w-3" />
                            Hide replies
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3" />
                            Show {(comment as any).replies.length} {(comment as any).replies.length === 1 ? 'reply' : 'replies'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user && user.uid !== comment.userId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-auto py-0 px-1 text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => {
                          setUserToBlock({userId: comment.userId, commentId: comment.id});
                          setBlockDialogOpen(true);
                        }}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Block
                      </Button>
                    )}
                    
                    {user && user.uid !== comment.userId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-auto py-0 px-1 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                        onClick={() => handleReport(comment.id, comment.userId)}
                      >
                        Report
                      </Button>
                    )}
                  </div>
                  
                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-3">
                      <Avatar className="h-8 w-8">
                        {user?.photoURL ? (
                          <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                        ) : (
                          <AvatarFallback>
                            {user ? getUserInitials(user.displayName || user.email?.split('@')[0] || 'U') : 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder={`Reply to ${comment.userDisplayName}...`}
                          className="mb-2 text-sm"
                          value={replyText[comment.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={!replyText[comment.id]?.trim()}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {(comment as any).replies && (comment as any).replies.length > 0 && showReplies[comment.id] && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                      {(comment as any).replies.map((reply: Comment) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            {reply.userPhotoURL ? (
                              <AvatarImage src={reply.userPhotoURL} alt={reply.userDisplayName} />
                            ) : (
                              <AvatarFallback>
                                {getUserInitials(reply.userDisplayName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium text-sm">{reply.userDisplayName}</h5>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                            
                            {/* Reply actions */}
                            <div className="flex gap-4 pt-1">
                              {user && user.uid !== reply.userId && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-auto py-0 px-1 text-red-500 hover:text-red-700 hover:bg-red-100 text-xs"
                                  onClick={() => {
                                    setUserToBlock({userId: reply.userId, commentId: reply.id});
                                    setBlockDialogOpen(true);
                                  }}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Block
                                </Button>
                              )}
                              
                              {user && user.uid !== reply.userId && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-auto py-0 px-1 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 text-xs"
                                  onClick={() => handleReport(reply.id, reply.userId)}
                                >
                                  Report
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Separator className="my-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
      
      {/* Block user confirmation dialog */}
      <AlertDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see their comments and they won't be able to interact with your content. This action will be reported to admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToBlock(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser} className="bg-red-500 hover:bg-red-600">Block</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommentSection;
