import subprocess
import sys

filter_script = """
if test "$GIT_AUTHOR_EMAIL" = "saitejap0007@gmail.com"
then
    export GIT_AUTHOR_NAME="Jaswanth Naidu Nainala"
    export GIT_AUTHOR_EMAIL="jaswanthnaidunainala@gmail.com"
fi
if test "$GIT_COMMITTER_EMAIL" = "saitejap0007@gmail.com"
then
    export GIT_COMMITTER_NAME="Jaswanth Naidu Nainala"
    export GIT_COMMITTER_EMAIL="jaswanthnaidunainala@gmail.com"
fi
"""

print("Running git filter-branch...")
result = subprocess.run([
    "git", "filter-branch", "-f", "--env-filter", filter_script, "--tag-name-filter", "cat", "--", "--all"
], capture_output=True, text=True)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)

if result.returncode == 0:
    print("Filter-branch completed successfully.")
else:
    print("Filter-branch failed.")
    sys.exit(1)
