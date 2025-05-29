// PostManager 클래스 정의
class PostManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 좋아요 버튼 이벤트 리스너
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.like-button')) {
                await this.toggleLike(e.target);
            }
        });

        // 댓글 작성 폼 제출 이벤트 리스너
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('.comment-form')) {
                e.preventDefault();
                await this.submitComment(e.target);
            }
        });

        // 리포스트 버튼 이벤트
        document.querySelectorAll('.repost-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showRepostModal(button.dataset.postId);
            });
        });

        // 게시물 수정/삭제 버튼 이벤트
        document.querySelectorAll('.post-action-btn.edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(button.closest('.post').dataset.postId, button.closest('.post').querySelector('.post-content').textContent);
            });
        });

        document.querySelectorAll('.post-action-btn.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePost(button.closest('.post').dataset.postId);
            });
        });
    }

    async toggleLike(button) {
        try {
            const postId = button.dataset.postId;
            const response = await fetch(`/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const likeCount = button.querySelector('.like-count');
                if (likeCount) {
                    likeCount.textContent = parseInt(likeCount.textContent) + (data.liked ? 1 : -1);
                }
                button.classList.toggle('liked', data.liked);

                // 알림 카운트 업데이트
                await this.updateNotificationCount();
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async submitComment(form) {
        try {
            const postId = form.dataset.postId;
            const content = form.querySelector('textarea').value;
            
            const response = await fetch(`/comments/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                const data = await response.json();
                this.appendComment(data.comment);
                form.reset();

                // 알림 카운트 업데이트
                await this.updateNotificationCount();
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    }

    async updateNotificationCount() {
        try {
            const response = await fetch('/notifications/unread-count');
            const data = await response.json();
            const badge = document.getElementById('notification-badge');
            
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating notification count:', error);
        }
    }

    appendComment(comment) {
        const commentsContainer = document.querySelector(`#comments-${comment.postId}`);
        if (commentsContainer) {
            const commentElement = this.createCommentElement(comment);
            commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
        }
    }

    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
            <div class="comment-header">
                <img src="${comment.commentAuthor.profileImage || '/images/default-profile.png'}" 
                     alt="프로필" 
                     class="comment-profile-image">
                <span class="comment-author">${comment.commentAuthor.name}</span>
                <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        `;
        return div;
    }

    showRepostModal(postId) {
        const modal = document.getElementById('repostModal');
        const form = document.getElementById('repostForm');
        const postIdInput = document.getElementById('repostPostId');
        
        postIdInput.value = postId;
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    hideRepostModal() {
        const modal = document.getElementById('repostModal');
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }

    async deletePost(postId) {
        if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || '게시물 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('게시물 삭제 중 오류가 발생했습니다.');
        }
    }

    openEditModal(postId, content) {
        const modal = document.getElementById('editModal');
        const textarea = document.getElementById('editContent');
        
        textarea.value = content;
        modal.dataset.postId = postId;
        modal.style.display = 'block';
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.style.display = 'none';
    }

    async updatePost() {
        const modal = document.getElementById('editModal');
        const postId = modal.dataset.postId;
        const content = document.getElementById('editContent').value;

        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || '게시물 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('게시물 수정 중 오류가 발생했습니다.');
        }
    }

    async submitRepost() {
        const postId = document.getElementById('repostPostId').value;
        const content = document.getElementById('repostContent').value;

        try {
            const response = await fetch('/posts/repost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postId, content })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || '리포스트에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error reposting:', error);
            alert('리포스트 중 오류가 발생했습니다.');
        }
    }
}

// 전역 PostManager 인스턴스 생성
window.postManager = new PostManager();

// 전역 함수들을 window 객체에 할당
window.toggleLike = window.postManager.toggleLike.bind(window.postManager);
window.submitComment = window.postManager.submitComment.bind(window.postManager);
window.showRepostModal = window.postManager.showRepostModal.bind(window.postManager);
window.hideRepostModal = window.postManager.hideRepostModal.bind(window.postManager);
window.deletePost = window.postManager.deletePost.bind(window.postManager);
window.openEditModal = window.postManager.openEditModal.bind(window.postManager);
window.closeEditModal = window.postManager.closeEditModal.bind(window.postManager);
window.updatePost = window.postManager.updatePost.bind(window.postManager);
window.submitRepost = window.postManager.submitRepost.bind(window.postManager);

// 페이지 로드 시 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 모달 외부 클릭 시 닫기
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            const postModal = document.getElementById('postModal');
            if (postModal) {
                postModal.style.display = 'none';
                modalOverlay.style.display = 'none';
            }
        });
    }

    // 리포스트 모달 외부 클릭 시 닫기
    const repostModalOverlay = document.getElementById('repostModalOverlay');
    if (repostModalOverlay) {
        repostModalOverlay.addEventListener('click', () => {
            const repostModal = document.getElementById('repostModal');
            if (repostModal) {
                repostModal.style.display = 'none';
                repostModalOverlay.style.display = 'none';
            }
        });
    }

    // 새 게시물 작성 버튼 클릭 이벤트
    const newPostButton = document.querySelector('.new-post');
    if (newPostButton) {
        newPostButton.addEventListener('click', () => {
            const modalOverlay = document.getElementById('modalOverlay');
            const postModal = document.getElementById('postModal');
            if (modalOverlay && postModal) {
                modalOverlay.style.display = 'block';
                postModal.style.display = 'block';
            }
        });
    }
}); 