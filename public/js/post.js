// 게시물 관련 공통 기능
class PostManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 좋아요 버튼 이벤트
        document.querySelectorAll('.action-button.like-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLike(button);
            });
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
        const postId = button.dataset.postId;
        const isLiked = button.dataset.liked === 'true';
        
        try {
            const response = await fetch(`/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const likesCount = button.querySelector('.likes-count');
                const heartIcon = button.querySelector('i');
                
                if (data.liked) {
                    button.classList.add('liked');
                    heartIcon.classList.remove('bi-heart');
                    heartIcon.classList.add('bi-heart-fill');
                } else {
                    button.classList.remove('liked');
                    heartIcon.classList.remove('bi-heart-fill');
                    heartIcon.classList.add('bi-heart');
                }
                
                likesCount.textContent = data.likes;
                button.dataset.liked = data.liked;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
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

// 페이지 로드 시 PostManager 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.postManager = new PostManager();
}); 
// 게시물 관련 공통 기능
class PostManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 좋아요 버튼 이벤트
        document.querySelectorAll('.action-button.like-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLike(button);
            });
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
        const postId = button.dataset.postId;
        const isLiked = button.dataset.liked === 'true';
        
        try {
            const response = await fetch(`/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const likesCount = button.querySelector('.likes-count');
                const heartIcon = button.querySelector('i');
                
                if (data.liked) {
                    button.classList.add('liked');
                    heartIcon.classList.remove('bi-heart');
                    heartIcon.classList.add('bi-heart-fill');
                } else {
                    button.classList.remove('liked');
                    heartIcon.classList.remove('bi-heart-fill');
                    heartIcon.classList.add('bi-heart');
                }
                
                likesCount.textContent = data.likes;
                button.dataset.liked = data.liked;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
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
}

// 페이지 로드 시 PostManager 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.postManager = new PostManager();
}); 