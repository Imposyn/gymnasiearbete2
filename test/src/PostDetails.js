import React, { useState, useEffect } from 'react';
import BlockUserButton from './BlockUserButton';
import './App.css';

const PostDetails = ({ post, isLoggedIn, username, setMessage,
  authToken, onBlock }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [postDetails, setPostDetails] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedPostTitle, setEditedPostTitle] = useState(post.Title);
  const [editedPostContent, setEditedPostContent] = useState(post.Content);
  const [replyText, setReplyText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [postVisibility, setPostVisibility] = useState(post.Visibility || 'public');
  const [tag, setTag] = useState('');
  const [editedTag, setEditedTag] = useState(post.Tag || ''); 
  const [userPostVote, setUserPostVote] = useState(null);
  const [userCommentVotes, setUserCommentVotes] = useState({});
  const [isBlocked, setIsBlocked] = useState(false);
  const [postVotes, setPostVotes] = useState({ upvotes: 0, downvotes: 0, points: 0 });
  const [commentVotes, setCommentVotes] = useState({});
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      const focusedButton = document.activeElement;
      if (focusedButton) {
        focusedButton.scrollIntoView();
      }
    } else if (event.key === '' && !event) {
      // Show the dropdown menu when Spacebar is pressed
      setShowActionsMenu(!showActionsMenu);
      event.preventDefault(); // Prevent default spacebar behavior
    } else if (event.key === 'Enter') {
      // Trigger the action when Enter is pressed
      console.log('Triggering action on Enter');
    }
  };  

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showActionsMenu]);
  
  useEffect(() => {
    if (!isFetched) {
      const fetchData = async () => {
        setIsFetched(true);
        const fetchedCommentId = await fetchPostAndComments(post.PostID);
        fetchTagForPost(post.PostID);
        fetchUserVotes(post.PostID, fetchedCommentId);
  
        // Fetch votes for the post
        const postVotes = await fetchPostVotes(post.PostID, authToken);
        setPostVotes(postVotes); // Update postVotes state
    
        // Fetch votes for each comment
        for (const comment of comments) {
          const commentVotes = await fetchCommentVotes(comment.CommentID, authToken);
        }
      };
  
      fetchData();
    }
  }, [post.PostID, isFetched, comments, authToken]);  
  
  const fetchPostAndComments = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Error fetching post details for post ${postId}`);
      }
  
      const data = await response.json();
  
      if (data && data.post) {
        setPostVisibility(data.post.Visibility || 'public');
        setPostDetails({
          ...postDetails,
          Author: data.post.Author,
        });
  
        // Set the commentId from the fetched data
        const fetchedCommentId = data.post.CommentID;
        fetchCommentsForPost(postId, fetchedCommentId);
  
        // Return the fetched commentId
        return fetchedCommentId;
      }
    } catch (error) {
      console.error(`Error fetching post details for post ${postId}:`, error);
    }
  };  

  const fetchCommentsForPost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/comments/${postId}`);
      if (!response.ok) {
        throw new Error(`Error fetching comments for post ${postId}`);
      }
      const data = await response.json();
  
      if (data && data.comments) {
        const sortedComments = [...data.comments].reverse();
        setComments(sortedComments);
  
        // Fetch votes for each comment after updating the state
        for (const comment of sortedComments) {
          const commentVotes = await fetchCommentVotes(comment.CommentID, authToken);
          // Update the commentVotes state
          setCommentVotes((prevCommentVotes) => ({
            ...prevCommentVotes,
            [comment.CommentID]: commentVotes,
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
    }
  };

// For posts
const fetchPostVotes = async (postId, authToken) => {
  if (!isLoggedIn) {
    return;
  }
  try {
      const response = await fetch(`http://localhost:8000/post/${postId}/votes`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${authToken}`,
          },
      });

      if (!response.ok) {
          throw new Error(`Error fetching post votes for post ${postId}`);
      }

      const data = await response.json();
      return {
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
          points: data.points || 0,
      };
  } catch (error) {
      console.error(`Error fetching post votes for post ${postId}:`, error);
      return { upvotes: 0, downvotes: 0, points: 0 };
  }
};

// For comments
const fetchCommentVotes = async (commentId, authToken) => {
  if (!isLoggedIn) {
    return;
  }
  try {
      const response = await fetch(`http://localhost:8000/comment/${commentId}/votes`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${authToken}`,
          },
      });

      if (!response.ok) {
          throw new Error(`Error fetching comment votes for comment ${commentId}`);
      }

      const data = await response.json();
      return {
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
          points: data.points || 0,
      };
  } catch (error) {
      console.error(`Error fetching comment votes for comment ${commentId}:`, error);
      return { upvotes: 0, downvotes: 0, points: 0 };
  }
};

const handleBlockUser = async (blockedUserId) => {
  if (blockedUserId === undefined) {
    setMessage('Invalid user ID');
    return;
  }

  // Continue with block user logic
  try {
    const response = await fetch('http://localhost:8000/block-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },      
      body: JSON.stringify({
        blockedUserId: blockedUserId,
      }),
    });
    
        if (response.ok) {
          // Check if the user was successfully blocked
          setMessage('User blocked successfully');
          setIsBlocked(true); // Set isBlocked to true
          if (onBlock) {
            onBlock(); // Handle blocking action
          }
    
          // Show an alert when the user is blocked
          window.alert('User blocked successfully');
        } else {
          // Log the status and response text for debugging
          setMessage('Error blocking user');
        }
      } catch (error) {
        setMessage('Error blocking user');
        console.error('Error blocking user:', error);
      }
    };
    
  const handleSortChange = async (sortOption) => {
    if (sortOption === 'latest') {
      // Sort by latest comment logic
      fetchCommentsForPost(post.PostID, 'latest');
    } else if (sortOption === 'points') {
      // Sort by points logic
      const sortedComments = [...comments].sort((a, b) => {
        const pointsA = commentVotes[a.CommentID]?.points || 0;
        const pointsB = commentVotes[b.CommentID]?.points || 0;
        return pointsB - pointsA;
      });
      setComments(sortedComments);
    } else {
      setMessage('Invalid sort option');
    }
  };  

  const fetchTagForPost = async (postId) => {
    if (!isLoggedIn) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/tags/${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error fetching tag for post ${postId}`);
      }
      const data = await response.json();
      if (data && data.tag) {
        setTag(data.tag.name);
      }
    } catch (error) {
      console.error(`Error fetching tag for post ${postId}:`, error);
    }
  };  

  const fetchUserVotes = async (postId) => {
    if (!isLoggedIn) {
      return;
    }
    try {
      const postVoteResponse = await fetch(`http://localhost:8000/api/posts/${postId}/user-vote`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (postVoteResponse.ok) {
        const data = await postVoteResponse.json();
        setUserPostVote(data.vote);
      }
  
// Fetch the user's votes for the post and comments
const votesResponse = await fetch(`http://localhost:8000/api/comments/${postId}/votes`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
});

if (votesResponse.ok) {
  const data = await votesResponse.json();
  setUserPostVote(data.postVote);
  setUserCommentVotes(data.commentVotes);
}
} catch (error) {
console.error('Error fetching user votes:', error);
}
};
  
  const handleUpvotePost = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${post.PostID}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        setUserPostVote('upvote');
      } else {
        console.error('Error upvoting post');
      }
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };
  
  const handleDownvotePost = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${post.PostID}/downvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        setUserPostVote('downvote');
      } else {
        console.error('Error downvoting post');
      }
    } catch (error) {
      console.error('Error downvoting post:', error);
    }
  };
  
  const handleUpvoteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Fetch all votes for the post after an upvote to update the state
        fetchUserVotes(post.PostID);
      } else {
        console.error('Error upvoting comment');
      }
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  };

  const handleDownvoteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}/downvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Fetch all votes for the post after a downvote to update the state
        fetchUserVotes(post.PostID);
      } else {
        console.error('Error downvoting comment');
      }
    } catch (error) {
      console.error('Error downvoting comment:', error);
    }
  };  

  const handleCommentSubmit = async () => {
    try {
      if (!commentText.trim()) {
        alert('Comment cannot be empty');
        return;
      }
  
      const response = await fetch('http://localhost:8000/add-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          postId: post.PostID,
          userId: username,
          commentText: commentText,
          parentCommentId: null,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error submitting comment');
      }
  
      const data = await response.json();
  
      fetchCommentsForPost(post.PostID);
  
      setCommentText('');
  
      // Display the server response using an alert
      alert(data.message || 'Comment submitted successfully');
    } catch (error) {
      // If there's an error, show an alert with an error message
      alert('Error submitting comment');
      console.error('Error submitting comment:', error);
    }
  };  

  const handleSavePost = async () => {
    try {
      const response = await fetch('http://localhost:8000/save-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          postId: post.PostID,
        }),
      });

      if (!response.ok) {
        throw new Error('Error saving post');
      }

      setSavedPosts([...savedPosts, post]);

      setMessage('Post saved successfully');
    } catch (error) {
      setMessage('Error saving post');
      console.error('Error saving post:', error);
    }
  };

  const handleEditComment = (commentId) => {
    setEditingCommentId(commentId);
    const commentToEdit = comments.find((comment) => comment.CommentID === commentId);
    setEditedCommentText(commentToEdit.Content);
  };

  const handleSaveEditedComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:8000/update-comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          updatedCommentText: editedCommentText,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error updating comment');
      }
  
      setEditingCommentId(null);
      setEditedCommentText('');
      fetchCommentsForPost(post.PostID);
  
      // Display success message using an alert
      alert('Comment updated successfully');
    } catch (error) {
      // Display error message using an alert
      alert('Error updating comment');
      console.error('Error updating comment:', error);
    }
  };
  
  const handleEditPost = () => {
    setIsEditingPost(true);
  };

  const handleSaveEditedPost = async () => {
    try {
      // Check if either title or content is empty
      if (!editedPostTitle.trim() || !editedPostContent.trim()) {
        window.alert('Title and content cannot be empty.');
        return;
      }
  
      const response = await fetch(`http://localhost:8000/update-post/${post.PostID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          updatedTitle: editedPostTitle,
          updatedContent: editedPostContent,
          updatedVisibility: postVisibility,
          updatedTag: editedTag,
          postId: post.PostID,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error updating post');
      }
  
      // Create a new tag if it doesn't exist in the database and associate it with the edited post
      if (editedTag) {
        await fetch('http://localhost:8000/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedTag,
            postId: post.PostID,
          }),
        });
      }
  
      setIsEditingPost(false);
      setEditedTag(editedTag);
      fetchPostAndComments(post.PostID);
  
      setMessage('Post updated successfully');
  
      // Display an alert when the post is saved successfully
      window.alert('Post updated successfully');
    } catch (error) {
      setMessage('Error updating post');
      console.error('Error updating post:', error);
  
      // Display an alert when there's an error saving the post
      window.alert('Error updating post');
    }
  };  

  const handleReply = (commentId) => {
    setReplyingToCommentId(commentId);
  };
  
  const handleReplySubmit = async (parentCommentId) => {
    try {
      // Ensure that parentCommentId is not undefined
      if (parentCommentId === undefined) {
        alert('Invalid parent comment ID');
        return;
      }
  
      // Check if reply text is empty
      if (!replyText.trim()) {
        alert('Reply cannot be empty');
        return;
      }
  
      const response = await fetch('http://localhost:8000/add-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: post.PostID,
          user_id: username,
          content: replyText,
          parent_comment_id: parentCommentId,
        }),
      });
  
      if (response.ok) {
        // Fetch comments again after reply submission
        fetchCommentsForPost(post.PostID);
        // Display success message using an alert
        alert('Reply submitted successfully');
      } else {
        console.error('Error submitting reply');
        // Display error message using an alert
        alert('Error submitting reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setReplyingToCommentId(null);
      setReplyText(''); // Clear the reply text after submission
    }
  };  

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Fetch comments again after deletion
        fetchCommentsForPost(post.PostID);
        // Display success message using an alert
        alert('Comment deleted successfully');
      } else {
        console.error('Error deleting comment');
        // Display error message using an alert
        alert('Error deleting comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };  

  const handleDeletePost = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${post.PostID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        setMessage('Post deleted successfully');
        // Display an alert when the post is deleted successfully
        window.alert('Post deleted successfully');
      } else {
        console.error('Error deleting post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };  

  const renderComments = (comments, parentCommentId) => (
    <div style={{ marginLeft: parentCommentId ? '0px' : '0' }}>
      {comments
        .filter(comment => comment.ParentCommentID === parentCommentId)
        .map((comment, index) => (
          <div key={index} className={comment.ParentCommentID !== null ? 'reply' : 'comment'}>
            {editingCommentId === comment.CommentID ? (
              <div>
                <textarea
                  value={editedCommentText}
                  onChange={(e) => setEditedCommentText(e.target.value)}
                />
                <button className="buttons" onClick={() => handleSaveEditedComment(comment.CommentID)}>
                  Save Comment
                </button>
              </div>
            ) : (
              <div>
            <strong>{comment.Username}</strong>
              <br></br>
              {comment.Content}
                {comment.ParentCommentID && (
                  <span style={{ marginLeft: '10px' }}>
                  </span>
                )}
           <div className="dropdown">
<button className="buttons buttons-dropdown" onClick={() => comment.CommentID && setShowActionsMenu(!showActionsMenu)}>
  Actions
</button>
  {showActionsMenu && (
    <div className="dropdown-content">
      <button className="buttons" onClick={() => handleUpvoteComment(comment.CommentID)}>
        Upvote
      </button>
      <button className="buttons" onClick={() => handleDownvoteComment(comment.CommentID)}>
        Downvote
      </button>
      <button className="buttons" onClick={() => handleEditComment(comment.CommentID)}>
        Edit Comment
      </button>
      <button className="buttons" onClick={() => handleDeleteComment(comment.CommentID)}>
        Delete Comment
      </button>
      <button className="buttons" onClick={() => handleReply(comment.CommentID)}>
        Reply
      </button>
      <button className="buttons" onClick={() => handleBlockUser(comment.UserID)}>
        Block User
      </button>
    </div>
  )}
</div>
                {isLoggedIn && (
                  <div>
                    Points: {commentVotes[comment.CommentID]?.points || 0}
                    {userCommentVotes[comment.CommentID] === 'upvote' ? (
                      <button disabled>Upvoted</button>
                    ) : userCommentVotes[comment.CommentID] === 'downvote' ? (
                      <button disabled>Downvoted</button>
                    ) : (
                      <div>
                      </div>
                    )}
                  </div>
                )}
                {replyingToCommentId === comment.CommentID && (
                  <div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button className="buttons" onClick={() => handleReplySubmit(comment.CommentID)}>
                      Submit Reply
                    </button>
                  </div>
                )}
                <div>
                  {comment.UserID !== undefined && comment.UserID !== username && (
                    <BlockUserButton
                      blockedUserId={comment.UserID}
                      authauthToken={authToken}
                      isBlockedUserPage={true}
                    />
                  )}
                  {comment.UserID === username && (
                    <>
                      <button onClick={() => handleEditComment(comment.CommentID)}>
                        Edit Comment
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Recursively render replies */}
            {renderComments(comments, comment.CommentID)}
          </div>
        ))}
    </div>
  );  

  const handleEditVote = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${postId}/edit-vote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Update the local state or perform any other necessary action
        alert('Vote updated successfully');
      } else {
        // Display error message
        alert('Error updating vote');
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      alert('Error updating vote');
    }
  };  
  
  const handleRemoveVote = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/${postId}/remove-vote`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Update the local state or perform any other necessary action
        alert('Vote removed successfully');
      } else {
        // Display error message
        alert('Error removing vote');
      }
    } catch (error) {
      console.error('Error removing vote:', error);
      alert('Error removing vote');
    }
  };
  
  const handleEditTag = async (tagId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: editedTag, 
        }),
      });
  
      if (response.ok) {
        // Update the local tag state
        setTag(editedTag);
        // Display success message
        alert('Tag updated successfully');
      } else {
        // Display error message
        alert('Error updating tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Error updating tag');
    }
  };  

  const handleDeleteTag = async (tagId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (response.ok) {
        // Update the local tag state
        setTag('');
        // Display success message
        alert('Tag deleted successfully');
      } else {
        // Display error message
        alert('Error deleting tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Error deleting tag');
    }
  };
  
  return (
    <div>
      {isEditingPost ? (
        <div>
          <input
            type="text"
            value={editedPostTitle}
            onChange={(e) => setEditedPostTitle(e.target.value)}
          />
          <textarea
            value={editedPostContent}
            onChange={(e) => setEditedPostContent(e.target.value)}
          />
          <label>
            Visibility:
            <select
              value={postVisibility}
              onChange={(e) => setPostVisibility(e.target.value)}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="dropdown">
            <button className="buttons buttons-dropdown" onClick={handleSaveEditedPost}>
              Actions
            </button>
            <div className="dropdown-content">
              <button className="buttons" onClick={handleSaveEditedPost}>
                Save post
              </button>
              <button className="buttons" onClick={() => setIsEditingPost(false)}>
                Cancel
              </button>
              {/* Include the new buttons for edit vote and delete tag here */}
              <button className="buttons" onClick={() => handleEditVote(post.PostID)}>
                Edit Vote
              </button>
              <button className="buttons" onClick={() => handleRemoveVote(post.PostID)}>
                Remove Vote
              </button>
              <button className="buttons" onClick={() => handleEditTag(post.PostID)}>
                Edit Tag
              </button>
              <button className="buttons" onClick={() => handleDeleteTag(post.PostID)}>
                Delete Tag
              </button>
            </div>
          </div>
          Tag:
          <input
            type="text"
            value={editedTag}
            onChange={(e) => setEditedTag(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <hr />
          <h2>{post.Title}</h2>
          <p className="post-content">{post.Content}</p>
          <p className="posted-by">Posted by: {postDetails.Author}</p>
          <p className="post-tag">Post tag: {tag}</p>
          {isLoggedIn && (
            <div>
              <div className="dropdown">
                <button className="buttons buttons-dropdown" onClick={handleUpvotePost}>
                  Actions
                </button>
                <div className="dropdown-content">
                  <button className="buttons" onClick={handleUpvotePost}>
                    Upvote
                  </button>
                  <button className="buttons" onClick={handleDownvotePost}>
                    Downvote
                  </button>
                  <button className="buttons" onClick={handleEditPost}>
                    Edit Post
                  </button>
                  <button className="buttons" onClick={handleSavePost}>
                    Save Post
                  </button>
                  <button className="buttons" onClick={handleDeletePost}>
                    Delete Post
                  </button>
                </div>
              </div>
              {userPostVote === 'upvote' ? (
                <button disabled>Upvoted</button>
              ) : (
                <div></div>
              )}
              {userPostVote === 'downvote' ? (
                <button disabled>Downvoted</button>
              ) : (
                <div></div>
              )}
              Points: {postVotes.points}
            </div>
          )}
        </div>
      )}
      <hr />
      <h3>Comments</h3>
      {isLoggedIn && (
        <div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment"
          />
          <button className="buttons" onClick={handleCommentSubmit}>
            Submit Comment
          </button>
          <br />
          <div className="dropdown">
            <button className="buttons buttons-dropdown">
              Sort comment by
            </button>
            <div className="dropdown-content">
              <button className="buttons" onClick={() => handleSortChange('latest')}>
                Sort by latest comment
              </button>
              <button className="buttons" onClick={() => handleSortChange('points')}>
                Sort by most points
              </button>
            </div>
          </div>
        </div>
      )}
      {renderComments(comments, null)}
    </div>
  );
  };
  export default PostDetails;  