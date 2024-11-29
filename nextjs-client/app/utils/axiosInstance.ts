// utils/axiosInstance.ts
import axios from 'axios';

let isRedirecting = false;

const axiosInstance = axios.create({
  withCredentials: true, // 쿠키 포함
});
// 응답 인터셉터 설정
axiosInstance.interceptors.response.use(
  (response) => response, // 정상 응답 처리
  (error) => {
    if (error.response) {
      const errorMsg = error.response.data.error;

      // 특정 에러 메시지에 따라 로그인 페이지로 리다이렉트
      if (
        errorMsg === 'have to re_login' ||
        errorMsg === '자동로그인 기간이 지났습니다. 다시 로그인해주세요.' ||
        errorMsg === '유효하지 않은 토큰입니다. 다시 로그인해주세요.'
      ) {
        if (!isRedirecting) {
            isRedirecting = true; // 리다이렉트 시작
  
            alert(errorMsg);
            window.location.href = '/'; // 로그인 페이지로 이동
  
            // 페이지가 새로 고침되므로 플래그 초기화는 불필요하지만, 안전을 위해 설정
            setTimeout(() => {
              isRedirecting = false;
            }, 1000);
          }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
