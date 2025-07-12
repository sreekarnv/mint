import React from 'react';
import { NavLink } from 'react-router';

interface ActiveNavLinkProps {
	children: React.ReactNode;
	to: string;
}

const ActiveNavLink: React.FC<ActiveNavLinkProps> = ({ children, to }) => {
	return (
		<>
			<NavLink
				className={({ isActive }) => {
					let classes = 'font-semibold';

					if (isActive) {
						classes += ' text-blue-500';
					}

					return classes;
				}}
				to={to}>
				{children}
			</NavLink>
		</>
	);
};

export default ActiveNavLink;
