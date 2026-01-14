'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Flex, Box, Card, Heading, Text, TextField, Button, Callout, IconButton } from '@radix-ui/themes';
import { LogIn, Info, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex align="center" justify="center" height="100vh" className="bg-gray-50">
            <Box width="400px">
                <Card size="4">
                    <Flex direction="column" gap="4">
                        <Flex direction="column" gap="1" align="center">
                            <Heading size="6">Gazistat Yönetim</Heading>
                            <Text size="2" color="gray">Devam etmek için giriş yapın</Text>
                        </Flex>

                        <Callout.Root color="blue" size="1">
                            <Callout.Icon>
                                <Info size={16} />
                            </Callout.Icon>
                            <Callout.Text>
                                Bu panel sadece yetkili kullanıcılar içindir.
                            </Callout.Text>
                        </Callout.Root>

                        {error && (
                            <Callout.Root color="red" size="1">
                                <Callout.Text>{error}</Callout.Text>
                            </Callout.Root>
                        )}

                        <form onSubmit={handleLogin}>
                            <Flex direction="column" gap="3">
                                <Box>
                                    <Text as="div" size="2" mb="1" weight="bold">E-posta</Text>
                                    <TextField.Root
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Text as="div" size="2" mb="1" weight="bold">Şifre</Text>
                                    <TextField.Root
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    >
                                        <TextField.Slot side="right">
                                            <IconButton
                                                type="button"
                                                variant="ghost"
                                                size="1"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </IconButton>
                                        </TextField.Slot>
                                    </TextField.Root>
                                </Box>
                                <Button type="submit" size="3" disabled={loading}>
                                    {loading ? 'Giriş yapılıyor...' : (
                                        <>
                                            <LogIn size={18} />
                                            Giriş Yap
                                        </>
                                    )}
                                </Button>
                            </Flex>
                        </form>
                    </Flex>
                </Card>
            </Box>
        </Flex>
    );
}
