document.addEventListener('DOMContentLoaded', function() {
    // 좋아요 버튼 이벤트 리스너
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', async function() {
            const postId = this.dataset.postId;
            const isLiked = this.dataset.liked === 'true';
            
            try {
                const response = await fetch(`/feed/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    const icon = this.querySelector('i');
                    const countSpan = this.querySelector('.likes-count');
                    
                    if (data.liked) {
                        icon.classList.remove('bi-heart');
                        icon.classList.add('bi-heart-fill');
                        this.classList.add('liked');
                    } else {
                        icon.classList.remove('bi-heart-fill');
                        icon.classList.add('bi-heart');
                        this.classList.remove('liked');
                    }
                    
                    countSpan.textContent = data.likes;
                    this.dataset.liked = data.liked;
                }
            } catch (error) {
                console.error('Error toggling like:', error);
            }
        });
    });
});

// 게시물 작성 모달 관련
const postModal = document.querySelector('.post-modal');
const postForm = document.querySelector('#post-form');
const imagePreview = document.querySelector('.image-preview');
const imageInput = document.querySelector('#image-input');

// 이미지 미리보기
imageInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// 게시물 작성
postForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(postForm);
  
  try {
    const response = await fetch('/posts', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      window.location.reload();
    } else {
      alert('게시물 작성에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('게시물 작성 중 오류가 발생했습니다.');
  }
});

// 댓글 작성
document.querySelectorAll('.comment-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const postId = e.target.dataset.postId;
    const content = e.target.querySelector('textarea').value;
    
    try {
      const response = await fetch(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

// 무한 스크롤
let page = 1;
const loadMorePosts = async () => {
  try {
    const response = await fetch(`/posts?page=${++page}`);
    const data = await response.json();
    
    if (data.posts.length > 0) {
      const feed = document.querySelector('.feed');
      data.posts.forEach(post => {
        // 게시물 HTML 생성 및 추가
        feed.appendChild(createPostElement(post));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// 스크롤 이벤트 리스너
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    loadMorePosts();
  }
});

// 게시물 HTML 생성 함수
function createPostElement(post) {
  const div = document.createElement('div');
  div.className = 'post';
  div.innerHTML = `
    <div class="post-header">
      <img src="${post.author.profileImage || '/images/default-profile.png'}" alt="프로필">
      <div class="post-info">
        <h3>${post.author.name}</h3>
        <span>${new Date(post.createdAt).toLocaleString()}</span>
      </div>
    </div>
    <div class="post-content">
      ${post.content}
      ${post.imageUrl ? `<img src="${post.imageUrl}" alt="게시물 이미지">` : ''}
    </div>
    <div class="post-actions">
      <button class="like-button ${post.isLiked ? 'liked' : ''}" data-post-id="${post.id}">
        좋아요 ${post.likes}
      </button>
      <button class="comment-button" data-post-id="${post.id}">
        댓글 ${post.replies}
      </button>
      <button class="repost-button" data-post-id="${post.id}">
        리포스트 ${post.reposts}
      </button>
    </div>
  `;
  return div;
} 