import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  // 실제 로그인 로직은 나중에 백엔드와 연결
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("로그인 시도");
    // 백엔드 연동 후 구현
  };

  // 실제 회원가입 로직은 나중에 백엔드와 연결
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("회원가입 시도");
    // 백엔드 연동 후 구현
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input id="username" placeholder="아이디" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {/* <Button variant="link" className="p-0 h-auto text-xs" onClick={() => alert("준비 중인 기능입니다.")}>
                      비밀번호 찾기
                    </Button> */}
                  </div>
                  <Input id="password" type="password" placeholder="비밀번호" required />
                </div>
                <Button type="submit" className="w-full">로그인</Button>
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
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Input id="email" type="email" placeholder="이메일" required />
                </div>
                <div className="space-y-2">
                  <Input id="new-username" placeholder="아이디" required />
                </div>
                <div className="space-y-2">
                  <Input id="new-password" type="password" placeholder="비밀번호" required />
                </div>
                <div className="space-y-2">
                  <Input id="confirm-password" type="password" placeholder="비밀번호 확인" required />
                </div>
                <Button type="submit" className="w-full">회원가입</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
