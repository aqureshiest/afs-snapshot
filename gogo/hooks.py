import os

def register_hook(base, git_hook, description, command):
    base.register_custom_child(git_hook, description, f"{command}")
    hook_file = ".git/hooks/" + git_hook
    # Create the actual git hook
    with open(hook_file, "w+") as f:
        f.write("#!/bin/sh\n")
        f.write("gogo " + git_hook + "\n")
    os.chmod(hook_file, 0o777)

def init_gadget(gobase):
    register_hook(gobase, "pre-commit", "Run pre-commit git hooks", "docker compose run -T --no-deps --rm service npm run lint")
    register_hook(gobase, "pre-push", "Run pr-push git hooks", "docker compose run -T  --no-deps --rm service npm run test")
