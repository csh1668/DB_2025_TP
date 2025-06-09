import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "../lib/authService";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoggedIn } = useAuth();

  // 로그인 상태
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 회원가입 상태
  const [registerCno, setRegisterCno] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [passportNumber, setPassportNumber] = useState("");

  // 이미 로그인한 경우 홈으로 리디렉션
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // 이메일 중복 확인
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      const exists = await authService.checkEmailExists(email);
      setIsEmailAvailable(!exists);
    } catch (error) {
      console.error('이메일 중복 확인 중 오류:', error);
      setIsEmailAvailable(null);
    }
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    
    try {
      await login(loginEmail, loginPassword);
      navigate('/'); // 로그인 성공 시 홈으로 이동
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setLoginError(error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    
    // 비밀번호 일치 확인
    if (registerPassword !== confirmPassword) {
      setRegisterError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 이메일 중복 최종 확인
    if (isEmailAvailable === false) {
      setRegisterError("이미 사용 중인 이메일입니다.");
      return;
    }

    setRegisterLoading(true);
    
    try {
      
      await register({
        cno: registerCno,
        name: registerName,
        passwd: registerPassword,
        email: registerEmail,
        passportNumber: passportNumber || undefined,
      });
      
      setRegisterSuccess(true);
      // 회원가입 성공 시 자동 로그인되므로 리디렉션은 useEffect에서 처리됨
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setRegisterError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">로그인</TabsTrigger>
          <TabsTrigger value="register">회원가입</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">로그인</CardTitle>
            </CardHeader>
            <CardContent>
              {loginError && (
                <Alert className="mb-4 border-red-400 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="이메일" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto text-xs" 
                      onClick={() => alert("준비 중인 기능입니다.")}
                    >
                      비밀번호 찾기
                    </Button>
                  </div>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="비밀번호" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginLoading}
                >
                  {loginLoading ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">회원가입</CardTitle>
            </CardHeader>
            <CardContent>
              {registerError && (
                <Alert className="mb-4 border-red-400 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}
              {registerSuccess && (
                <Alert className="mb-4 border-green-400 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>회원가입에 성공했습니다! 로그인 페이지로 이동합니다.</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-cno">아이디</Label>
                  <Input 
                    id="register-cno" 
                    placeholder="아이디" 
                    value={registerName}
                    onChange={(e) => setRegisterCno(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-name">이름</Label>
                  <Input 
                    id="register-name" 
                    placeholder="이름" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">이메일</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="이메일" 
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        setIsEmailAvailable(null);
                      }}
                      onBlur={() => checkEmailAvailability(registerEmail)}
                      required 
                      className={`flex-1 ${
                        isEmailAvailable === true ? 'border-green-500' : 
                        isEmailAvailable === false ? 'border-red-500' : ''
                      }`}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => checkEmailAvailability(registerEmail)}
                    >
                      중복확인
                    </Button>
                  </div>
                  {isEmailAvailable === true && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> 사용 가능한 이메일입니다.
                    </p>
                  )}
                  {isEmailAvailable === false && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" /> 이미 사용 중인 이메일입니다.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">비밀번호</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="비밀번호 (최소 4자 이상)" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required 
                    minLength={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="비밀번호 확인" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className={confirmPassword && confirmPassword !== registerPassword ? 'border-red-500' : ''}
                  />
                  {confirmPassword && confirmPassword !== registerPassword && (
                    <p className="text-xs text-red-600 mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport-number">여권번호 (선택)</Label>
                  <Input 
                    id="passport-number" 
                    placeholder="여권번호 (선택)" 
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerLoading || isEmailAvailable === false || (confirmPassword && confirmPassword !== registerPassword)}
                >
                  {registerLoading ? '처리 중...' : '회원가입'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
