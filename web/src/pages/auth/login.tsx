import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import type { User } from '@/types/user';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';

const loginSchema = Yup.object()
	.shape({
		email: Yup.string()
			.required('user must provide their email')
			.email('please provide a valid email')
			.trim(),
		password: Yup.string().required('user must provide a password'),
	})
	.required();

type LoginSchemaType = Yup.InferType<typeof loginSchema>;

const LoginPage: React.FC = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { isPending, mutate } = useMutation({
		mutationFn: async (body: LoginSchemaType) => {
			return await fetcher<User, LoginSchemaType>('/api/auth/login', {
				method: 'POST',
				body,
			});
		},
		onSuccess(data: User) {
			queryClient.setQueryData(['auth.user'], data);
			toast.success('logged in successfully', {
				position: 'top-center',
				onAutoClose() {
					navigate('/dashboard', { replace: true });
				},
			});
		},
		onError(error) {
			toast.error(error.message, { position: 'top-center' });
		},
	});
	const form = useForm<LoginSchemaType>({
		resolver: yupResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	function onSubmit(values: LoginSchemaType) {
		mutate(values);
	}

	return (
		<>
			<div className='max-w-xl mx-auto py-6 px-4'>
				<h1 className='font-semibold text-2xl mb-5'>Log In</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input type='email' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password *</FormLabel>
									<FormControl>
										<Input type='password' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button disabled={isPending} type='submit'>
							{isPending && <Loader2Icon className='animate-spin' />}
							Submit
						</Button>
					</form>
				</Form>
				<p className='text-center text-sm py-6'>
					Don't have an account ? Click here to{' '}
					<Link className='font-semibold hover:underline' to='/signup'>
						Sign Up
					</Link>
				</p>
			</div>
		</>
	);
};

export default LoginPage;
