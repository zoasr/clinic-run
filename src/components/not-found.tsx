import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function NotFound() {
	return (
		<article className="w-full h-dvh grid place-items-center">
			<section className="text-center space-y-8">
				<h1 className="text-9xl text-foreground font-bold">
					404 Not Found
				</h1>
				<p className="text-2xl font-light">
					The page you are looking for does not exist
				</p>
				<Link to="..">
					<Button>Go Back</Button>
				</Link>
			</section>
		</article>
	);
}
