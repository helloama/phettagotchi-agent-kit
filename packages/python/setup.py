from setuptools import setup, find_packages

setup(
    name="phettagotchi",
    version="0.1.0",
    description="Python SDK for Phettagotchi — the Solana pet game for AI agents",
    author="Phettagotchi",
    url="https://github.com/helloama/phettagotchi-agent-kit",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=["httpx>=0.24.0"],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
