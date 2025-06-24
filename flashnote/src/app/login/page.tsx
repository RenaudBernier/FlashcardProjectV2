'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Typography,
    Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if user doc exists, if not, create it
                const userDocRef = doc(db, 'root', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) {
                    await setDoc(userDocRef, {
                        createdAt: new Date().toISOString(),
                        folderOrder: [],
                        nextCardId: 0,
                        nextSheetId: 0,
                        nextFolderId: 0,
                    });
                }
                router.replace('/');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, provider);
            // Redirect handled by onAuthStateChanged
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <Box
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="background.default"
        >
            <Card sx={{ minWidth: 350, p: 2 }}>
                <CardContent>
                    <Typography variant="h5" component="h2" fontWeight="bold" mb={2}>
                        Login
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        sx={{ py: 1.5, fontWeight: 600 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}

