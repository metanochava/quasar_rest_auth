push:
	npm version patch --no-git-tag-version; \
	git add .; \
	VERSION=$$(node -p "require('./package.json').version"); \
	read -p "Mensagem do release: " m; \
	git commit -m "release: v$$VERSION - $$m"; \
	git push origin main; 
pushtag:
	npm version patch --no-git-tag-version; \
	git add .; \
	VERSION=$$(node -p "require('./package.json').version"); \
	read -p "Mensagem do release: " m; \
	git commit -m "release: v$$VERSION - $$m"; \
	git tag v$$VERSION; \
	git push origin main; \
	git push origin v$$VERSION; 
pushnpm:
	npm version patch --no-git-tag-version; \
	git add .; \
	VERSION=$$(node -p "require('./package.json').version"); \
	read -p "Mensagem do release: " m; \
	git commit -m "release: v$$VERSION - $$m"; \
	git tag v$$VERSION; \
	git push origin main; \
	git push origin v$$VERSION; \
	npm publish


