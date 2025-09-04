import { Search } from "lucide-react";
import { useForm } from "@tanstack/react-form";

import { Label } from "@/components/ui/label";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/components/ui/sidebar";

interface SearchFormProps extends React.ComponentProps<"form"> {
	onSearch?: (query: string) => void;
}

export function SearchForm({ onSearch, ...props }: SearchFormProps) {
	const form = useForm({
		defaultValues: {
			search: "",
		},
		onSubmit: async ({ value }) => {
			if (onSearch) {
				onSearch(value.search);
			}
		},
	});

	return (
		<form
			{...props}
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<SidebarGroup className="py-0">
				<SidebarGroupContent className="relative">
					<form.Field
						name="search"
						children={(field) => (
							<>
								<Label htmlFor="search" className="sr-only">
									Search
								</Label>
								<SidebarInput
									id="search"
									placeholder="Search the docs..."
									className="pl-8"
									value={field.state.value}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
								/>
							</>
						)}
					/>
					<Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
				</SidebarGroupContent>
			</SidebarGroup>
		</form>
	);
}
