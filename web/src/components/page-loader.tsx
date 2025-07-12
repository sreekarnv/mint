import { Loader2Icon } from 'lucide-react';
import React from 'react';

const PageLoader: React.FC = () => {
	return (
		<>
			<div className='h-screen w-screen flex items-center justify-center'>
				<Loader2Icon className='animate-spin h-20 w-20' />
			</div>
		</>
	);
};

export default PageLoader;
